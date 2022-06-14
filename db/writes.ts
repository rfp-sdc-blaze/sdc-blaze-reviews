import { Client, Pool } from 'pg';
import { string } from 'pg-format';
import { Serializer } from 'v8';
import { Photo, Review, ReviewHead } from '.';
const format = require('pg-format');

interface SubmittedReview extends Review {
  product_id: number;
  photos: Photo[];
  email: string;
  characteristics: any;
}

export async function addReview(
  body: SubmittedReview
): Promise<unknown | false> {
  const pool = new Pool({
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD
  });

  try {
    console.log(body.characteristics);
    // INSERT REVIEW
    const reviewValues = [
      body.product_id,
      body.rating,
      body.summary,
      body.body,
      body.recommend,
      body.reviewer_name,
      body.email,
      body.characteristics
    ];

    let reviewID = await pool.query(
      `
      INSERT INTO reviews.reviews
      (
          product_id,
          rating,
          summary,
          body,
          recommended,
          name,
          email
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `,
      reviewValues
    );

    const star_col = `num_${String(body.rating)}_stars`;
    const recommended_inc = body.recommend ? 1 : 0;
    reviewID = reviewID.rows[0].id;

    // Insert photos
    if (body.photos.length) {
      await pool.query(
        `
        INSERT INTO reviews.photos (review_id, url)
        SELECT $1, value FROM json_array_elements($2);
      `,
        [reviewID, JSON.stringify(body.photos)] // postgres is drunk
      );
    }
    // Update metadata
    // num_reviews, star count, num_recommended
    await pool.query(
      format(
        `
        UPDATE reviews.products rp
        SET
          %s = %s + 1,
          num_reviews = num_reviews + 1,
          num_recommended = num_recommended + %s
        WHERE rp.id = %s;
      `,
        star_col,
        star_col,
        recommended_inc,
        body.product_id
      )
    );

    let characteristicNames: any = await pool.query(
      `
        SELECT json_agg(t) FROM (SELECT (name, id) FROM reviews.characteristics rc
        WHERE rc.product_id = $1) as t;
    `,
      [body.product_id]
    );

    characteristicNames = characteristicNames.rows[0].json_agg;
    characteristicNames = Object.keys(characteristicNames).map(
      (k, i) => characteristicNames[k].row
    );

    console.log(characteristicNames);

    let queryString = characteristicNames.reduce((memo: any, char: any) => {
      const charName = char.f1.toLowerCase();
      const charId = char.f2;
      if (!body.characteristics[charId]) {
        return memo;
      }
      const fitColName = `${charName}_id`;
      const valueColName = `${charName}_total`;
      memo += format('    %s = %s,\n', fitColName, charId);
      memo += format(
        '    %s = %s + %s,\n',
        valueColName,
        valueColName,
        body.characteristics[charId]
      );

      return memo;
    }, 'UPDATE reviews.products \nSET\n');

    queryString = queryString.slice(0, queryString.length - 2) + '\n';
    queryString += format('WHERE reviews.products.id = %s;', body.product_id);
    console.log(queryString);
    //await pool.query(queryString);
    return;
  } catch (error) {
    console.log(error);
    return error;
  }
}
