// const pool = require('./db').pool;
require('dotenv').config();
import { Client, Pool } from 'pg';
require('console-log-timestamp')('America/Los_Angeles');

// async function clearAndMake() {
//   console.log('About to migrate from CSV clones to optimized Schema');
//   const client = new Client({
//     user: process.env.USER,
//     password: process.env.PASSWORD,
//     database: 'template1'
//   });

//   try {
//     console.log('Deleting existing schema...');
//     await client.query(`DROP SCHEMA if exists reviews CASCADE;`);
//     await client.end();
//     console.log('Successfully dropped and created Database SDC');
//   } catch (e) {
//     await client.end();
//     console.error(e);
//     return;
//   }
// }
const pool = new Pool({
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

// pool.on('error', (error: void, client: void) => {
//   console.error('Unexpected error on idle client', error);
//   process.exit(-1);
// });

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  console.log('Beginning data migration');
  console.log('Type y to continue:');
  const allow = await new Promise((resolve) => {
    readline.question('->', resolve);
  });

  if (allow !== 'y') {
    process.exit();
  }

  const client = await pool.connect();

  try {
    console.log('Adding indices to reviews tables');
    await pool.query(
      `CREATE INDEX reviews_indexses ON reviews.reviews (product_id);`
    );
    console.log('Adding indices to products tables at products.id');
    await pool.query(
      `CREATE UNIQUE INDEX products_indexses ON reviews.products (id);`
    );
    console.log('Adding indices reviews.characteristics_reviews_csv tables');
    await pool.query(
      `CREATE INDEX characteristics_indexses ON reviews.characteristics_reviews_csv (product_id);`
    );
    console.log('Updating characteristics reviews table to include name...');
    await pool.query(
      `UPDATE reviews.characteristics_reviews_csv
          SET name = reviews.characteristics_csv.name,
              product_id = reviews.characteristics_csv.product_id
          FROM reviews.characteristics_csv
          WHERE reviews.characteristics_reviews_csv.characteristic_id = reviews.characteristics_csv.id;`
    );
    console.log('Updating reviews count for products table');
    await pool.query(
      `UPDATE reviews.products
       SET num_reviews =
         (SELECT count(*)
          FROM reviews.reviews as rr
          WHERE rr.product_id = reviews.products.id)`
    );

    console.log('Updating star counts');
    await pool.query(
      `UPDATE reviews.products
       SET num_1_stars =
         (SELECT count(*)
          FROM reviews.reviews as rr
          WHERE rr.product_id = reviews.products.id
          AND rr.rating = 1)`
    );

    await pool.query(
      `UPDATE reviews.products
       SET num_2_stars =
         (SELECT count(*)
          FROM reviews.reviews as rr
          WHERE rr.product_id = reviews.products.id
          AND rr.rating = 2)`
    );

    await pool.query(
      `UPDATE reviews.products
       SET num_3_stars =
         (SELECT count(*)
          FROM reviews.reviews as rr
          WHERE rr.product_id = reviews.products.id
          AND rr.rating = 3)`
    );

    await pool.query(
      `UPDATE reviews.products
       SET num_4_stars =
         (SELECT count(*)
          FROM reviews.reviews as rr
          WHERE rr.product_id = reviews.products.id
          AND rr.rating = 4)`
    );

    await pool.query(
      `UPDATE reviews.products
       SET num_5_stars =
         (SELECT count(*)
          FROM reviews.reviews as rr
          WHERE rr.product_id = reviews.products.id
          AND rr.rating = 5)`
    );

    await pool.query(
      `UPDATE reviews.products
       SET num_recommended =
         (SELECT count(*)
          FROM reviews.reviews as rr
          WHERE rr.product_id = reviews.products.id
          AND rr.recommended = true);`
    );

    console.log('Updating fitTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET fit_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Fit');`
    );

    console.log('Updating widthTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET width_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Width');`
    );

    console.log('Updating lengthTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET length_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Length');`
    );

    console.log('Updating comfortTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET comfort_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Comfort');`
    );

    console.log('Updating qualityTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET quality_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Quality');`
    );

    console.log('Updating fitID metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET fit_id =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Fit');`
    );
    console.log('Updating widthID metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET width_id =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Width');`
    );
    console.log('Updating lengthID metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET length_id =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Length');`
    );
    console.log('Updating qualityID metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET quality_id =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Quality');`
    );
    console.log('Updating characteristics metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET comfort_id =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Comfort');`
    );
    // product_Id num_1_stars num_reviews total_characteristics

    // console.log('Adding foreign keys and setting timestamps...');
    // await pool.query(
    //   `ALTER TABLE reviews.photos
    //    ADD CONSTRAINT fk_review_photos_reviews
    //    FOREIGN KEY ( review_id )
    //    REFERENCES "reviews".reviews( id );`
    // );

    // await pool.query(
    //   `ALTER TABLE reviews.reviews
    //    ALTER COLUMN created_at TYPE timestamp(3)
    //    USING to_timestamp(created_at / 1000.0),
    //    ALTER COLUMN created_at SET DEFAULT LOCALTIMESTAMP(3);`
    // );

    console.log('Done.');
    process.exit();
  } finally {
    client.release();
  }
})().catch((error) => {
  console.log(error);
  process.exit();
});
