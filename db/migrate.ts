// const pool = require('./db').pool;
require('dotenv').config();
import { Client, Pool } from 'pg';

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
  host: '34.212.170.180',
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

// pool.on('error', (error: void, client: void) => {
//   console.error('Unexpected error on idle client', error);
//   process.exit(-1);
// });
const logT = () => {
  return new Date().toLocaleString().split(' ').slice(1).join(' ');
};

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
    console.log(logT(), 'Adding indices to reviews tables');
    await pool.query(
      `CREATE INDEX reviews_indx ON reviews.reviews (product_id);`
    );
    console.log(logT(), 'Adding indices to products tables at products.id');
    await pool.query(
      `CREATE UNIQUE INDEX products_indx ON reviews.products (id);`
    );
    console.log('Adding indices reviews.characteristics_reviews_csv tables');
    await pool.query(
      `CREATE INDEX characteristics_reviews_indx ON reviews.characteristics_reviews_csv (product_id);`
    );
    console.log('Adding indices reviews.characteristics_reviews_csv tables');
    await pool.query(
      `CREATE INDEX characteristics_indx ON reviews.characteristics_csv (id);`
    );
    console.log('Adding indices reviews.photos tables');
    await pool.query(`CREATE INDEX photos_indx ON reviews.photos (id);`);

    console.log('Adding indices reviews.photos tables');
    await pool.query(
      `CREATE INDEX photos_review_indx ON reviews.photos (review_id);`
    );
    await pool.query(
      `CREATE INDEX reviews_created_idx ON reviews.reviews(created_at ASC);`
    );

    await pool.query(
      `CREATE INDEX reviews_helpfullnes_idx ON reviews.reviews(helpful DESC);`
    );

    console.log('Updating the serial IDs for reviews and photos...');
    await pool.query(`
    SELECT setval('reviews.reviews_id_seq', (SELECT MAX(id) FROM reviews.reviews)+1);
    SELECT setval('reviews.photos_id_seq', (SELECT MAX(id) FROM reviews.photos)+1);
  `);
    console.log(
      logT(),
      'Updating characteristics reviews table to include name...'
    );
    await pool.query(
      `UPDATE reviews.characteristics_reviews_csv
          SET name = reviews.characteristics_csv.name,
              product_id = reviews.characteristics_csv.product_id
          FROM reviews.characteristics_csv
          WHERE reviews.characteristics_reviews_csv.characteristic_id = reviews.characteristics_csv.id;`
    );
    console.log(logT(), 'Updating reviews count for products table');
    await pool.query(
      `UPDATE reviews.products
       SET num_reviews =
         (SELECT count(*)
          FROM reviews.reviews as rr
          WHERE rr.product_id = reviews.products.id)`
    );

    console.log(logT(), 'Updating star counts');
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

    console.log(logT(), 'Updating fitTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET fit_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Fit');`
    );

    console.log(logT(), 'Updating widthTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET width_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Width');`
    );

    console.log(logT(), 'Updating lengthTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET length_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Length');`
    );

    console.log(logT(), 'Updating comfortTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET comfort_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Comfort');`
    );

    console.log(logT(), 'Updating qualityTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET quality_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Quality');`
    );
    console.log(logT(), 'Updating qualityTotal metadata...');
    await pool.query(
      `UPDATE reviews.products
       SET size_total =
         (SELECT sum(value)
          FROM reviews.characteristics_reviews_csv as rc
          WHERE rc.product_id = reviews.products.id
          AND rc.name = 'Size');`
    );

    console.log(logT(), 'Updating fitID metadata...');
    await pool.query(
      `UPDATE reviews.products rp
       SET fit_id = rc.id
          FROM reviews.characteristics_csv rc
          WHERE rc.product_id = rp.id
          AND rc.name = 'Fit';`
    );
    console.log(logT(), 'Updating widthID metadata...');
    await pool.query(
      `UPDATE reviews.products rp
       SET width_id = rc.id
          FROM reviews.characteristics_csv rc
          WHERE rc.product_id = rp.id
          AND rc.name = 'Width';`
    );
    console.log(logT(), 'Updating lengthID metadata...');
    await pool.query(
      `UPDATE reviews.products rp
       SET length_id = rc.id
          FROM reviews.characteristics_csv rc
          WHERE rc.product_id = rp.id
          AND rc.name = 'Length';`
    );
    console.log(logT(), 'Updating qualityID metadata...');
    await pool.query(
      `UPDATE reviews.products rp
       SET quality_id = rc.id
          FROM reviews.characteristics_csv rc
          WHERE rc.product_id = rp.id
          AND rc.name = 'Quality';`
    );
    console.log(logT(), 'Updating characteristics metadata...');
    await pool.query(
      `UPDATE reviews.products rp
       SET comfort_id = rc.id
          FROM reviews.characteristics_csv rc
          WHERE rc.product_id = rp.id
          AND rc.name = 'Comfort';`
    );
    console.log(logT(), 'Updating characteristics metadata...');
    await pool.query(
      `UPDATE reviews.products rp
       SET size_id = rc.id
          FROM reviews.characteristics_csv rc
          WHERE rc.product_id = rp.id
          AND rc.name = 'Size';`
    );
    // product_Id num_1_stars num_reviews total_characteristics

    console.log(logT(), 'Adding foreign keys and setting timestamps...');
    await pool.query(
      `ALTER TABLE reviews.photos
       ADD CONSTRAINT fk_review_photos_reviews
       FOREIGN KEY ( review_id )
       REFERENCES "reviews".reviews( id );`
    );

    await pool.query(
      `ALTER TABLE reviews.reviews
       ALTER COLUMN created_at TYPE timestamp(3)
       USING to_timestamp(created_at / 1000.0),
       ALTER COLUMN created_at SET DEFAULT LOCALTIMESTAMP(3);`
    );

    console.log(logT(), 'Done.');
    process.exit();
  } finally {
    client.release();
  }
})().catch((error) => {
  console.log(error);
  process.exit();
});
