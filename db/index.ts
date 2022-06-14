import { Client, Pool } from 'pg';
import { string } from 'pg-format';
import { Serializer } from 'v8';

export interface Photo {
  id: number;
  url: string;
}
export interface Review {
  review_id: number;
  rating: number;
  summary: string;
  recommend: boolean;
  response: string;
  body: string;
  date: string;
  reviewer_name: string;
  helpfulness: number;
}

export interface DetailReview extends Review {
  photos: Photo[];
}

export interface ReviewHead {
  product: string;
  page: number;
  count: number;
  results: DetailReview[];
}
export async function getProductReview(
  productId: number,
  sort: string,
  count: number,
  page: number,
  offset: number
): Promise<unknown | false> {
  const client = new Client({
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD
  });

  try {
    await client.connect();
    console.log(productId, sort, count, offset, page);
    const query = await client.query(
      `
      SELECT
         json_build_object(
             'product', $1::integer,
             'page', $5::integer,
             'count', $3::integer,
             'results', (

              SELECT json_agg(
                      json_build_object(
                        'id', reviews.reviews.id,
                        'rating', rating,
                        'summary', summary,
                        'recommend', recommended,
                        'response', response,
                        'body', body,
                        'date', created_at,
                        'review_name', name,
                        'helpfulness', helpful,
                         'photos', ( SELECT
                          json_agg(
                            json_build_object(
                              'id', id,
                              'url', url
                            )
                          )
                            FROM reviews.photos
                            WHERE reviews.photos.review_id = reviews.reviews.id
                        )
                      )
                    ) as results
                      FROM reviews.reviews
                      WHERE reviews.reviews.product_id = $1
                      AND reviews.reviews.reported = false
                      ORDER BY $2
                      LIMIT $3
                      OFFSET $4
           )
        );
  `,
      [productId, sort, count, offset, page]
    );
    await client.end();
    return query.rows[0];
  } catch (e) {
    console.error(e);
    return false;
  }
}
interface ReviewMeta {
  product_id: number;
  ratings: Ratings;
  recommended: number;
  characteristics: Characteristics;
}
interface Ratings {
  '0': number;
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
}
interface Characteristics {
  Fit: Fit;
  Width: Width;
  Comfort: Comfort;
  Quality: Quality;
  Length: Length;
}
interface Fit {
  id: number;
  value: number;
}
interface Width {
  id: number;
  value: number;
}
interface Comfort {
  id: number;
  value: number;
}
interface Quality {
  id: number;
  value: number;
}
interface Length {
  id: number;
  value: number;
}
export async function getReviewMeta(
  productId: number
): Promise<unknown | false> {
  const client = new Client({
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD
  });

  try {
    await client.connect();

    const reviewMeta = await client.query(
      `SELECT (
          json_build_object(
              'product_id', id,
              'ratings', json_build_object(
                  '1', num_1_stars,
                  '2', num_2_stars,
                  '3', num_3_stars,
                  '4', num_4_stars,
                  '5', num_5_stars
              ),
              'recommended', num_recommended,
              'characteristics', json_build_object(
                  'Fit', json_build_object(
                      'id', fit_id,
                      'value', fit_total::float / num_reviews
                  ),
                  'Width', json_build_object(
                      'id', width_id,
                      'value', width_total::float / num_reviews
                  ),
                  'Comfort', json_build_object(
                      'id', comfort_id,
                      'value', comfort_total::float / num_reviews
                  ),
                  'Quality', json_build_object(
                      'id', quality_id,
                      'value', quality_total::float / num_reviews
                  ),
                  'Length', json_build_object(
                      'id', length_id,
                      'value', length_total::float / num_reviews
                  )
              )
          )
      )
      FROM reviews.products WHERE reviews.products.id = $1;`,
      [productId]
    );
    await client.end();
    return reviewMeta.rows[0].json_build_object;
  } catch (e) {
    console.error(e);
    return false;
  }
}
