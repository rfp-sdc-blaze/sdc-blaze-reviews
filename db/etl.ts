require('dotenv').config();
const format = require('pg-format');
import { Client, Pool } from 'pg';

// async function clearAndMake() {
//   console.log('About to clear databases and remake database/tables');
//   const client = new Client({
//     user: process.env.USER,
//     password: process.env.PASSWORD,
//     database: 'template1'
//   });

//   try {
//     console.log('Deleting existing schema...');
//     await client.query(`DROP SCHEMA if exists reviews CASCADE;`);
//     await client.query(
//         `CREATE DATABASE SDC `
//     )
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// pool.on('error', (_error: Error, _client: Client) => {y
//   console.error;
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
  console.log('Data will be overwritten');
  console.log('Type y to continue:');
  const allow = await new Promise((resolve) => {
    readline.question('->', resolve);
  });

  if (allow !== 'y') {
    process.exit();
  }

  console.log('Re-Creating the database...');
  const tempClient = new Client({
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: 'template1'
  });

  try {
    await tempClient.connect();
    await tempClient.query(
      format('DROP DATABASE IF EXISTS %s;', process.env.DATABASE)
    );
    await tempClient.query(
      format('CREATE DATABASE %s;', [process.env.DATABASE])
    );
    await tempClient.end();
  } catch (e) {
    await tempClient.end();
    console.error;
  }
  const client = await pool.connect();
  try {
    console.log(logT(), 'Deleting existing schema...');
    await client.query(`DROP SCHEMA if exists reviews CASCADE;`);

    console.log(logT(), 'Creating new schema...');
    await client.query(`CREATE SCHEMA reviews;`);

    console.log(logT(), 'Creating reviews table...');
    await client.query(
      `CREATE  TABLE if not exists reviews.reviews (
        id                   serial   PRIMARY KEY,
        product_id           integer  NOT NULL  ,
        rating               smallint  NOT NULL  ,
        created_at           bigint   NOT NULL   ,
        summary              varchar  NOT NULL  ,
        body                 varchar  NOT NULL  ,
        recommended          boolean DEFAULT false NOT NULL  ,
        reported             boolean DEFAULT false NOT NULL  ,
        name                 varchar  NOT NULL  ,
        email                varchar  NOT NULL  ,
        response             varchar    ,
        helpful              integer DEFAULT 0 NOT NULL  

       );`
    );

    console.log(logT(), 'Creating meta table...');
    await client.query(
      `CREATE  TABLE if not exists reviews.products (
        id                   integer  NOT NULL  ,
        num_1_stars          integer DEFAULT 0   ,
        num_2_stars          integer DEFAULT 0   ,
        num_3_stars          integer DEFAULT 0   ,
        num_4_stars          integer DEFAULT 0   ,
        num_5_stars          integer DEFAULT 0   ,
        fit_id              integer    ,
        width_id            integer    ,
        length_id           integer    ,
        comfort_id          integer    ,
        quality_id          integer    ,
        size_id             integer     ,
        fit_total            integer     ,
        width_total          integer     ,
        length_total         integer     ,
        comfort_total        integer     ,
        quality_total        integer     ,
        size_total           integer     ,
        num_reviews          integer DEFAULT 0   ,
        num_recommended      integer DEFAULT 0   ,
        CONSTRAINT pk_products PRIMARY KEY ( id )
       );`
    );

    console.log(logT(), 'Creating photos table...');
    await client.query(
      `CREATE  TABLE if not exists reviews.photos (
        id                   serial  PRIMARY KEY  ,
        review_id            integer  NOT NULL  ,
        url                  varchar  NOT NULL);`
    );

    console.log(logT(), 'Creating characteristics table...');
    await client.query(
      `CREATE TABLE if not exists reviews.characteristics_csv (
        id                   integer  NOT NULL  ,
        product_id           integer  NOT NULL  ,
        name                 varchar  NOT NULL);`
    );

    console.log(logT(), 'Creating characteristics reviews table...');
    await client.query(
      `CREATE TABLE if not exists reviews.characteristics_reviews_csv (
        id                   integer  NOT NULL  ,
        characteristic_id    integer  NOT NULL  ,
        review_id            integer  NOT NULL  ,
        value                integer  NOT NULL ,
        product_id           integer  ,
        name                 varchar);`
    );

    console.log(logT(), 'Creating temporary product table...');
    await pool.query(
      `CREATE TABLE if not exists reviews.temp (
          id  integer,
          name varchar,
          slogan varchar,
          description varchar,
          category varchar,
          default_price int
      );`
    );

    await pool.query(
      `INSERT INTO reviews.products (id)
       SELECT id
       FROM reviews.temp;`
    );

    console.log(logT(), 'Copying product ids in to temporary table...');
    await pool.query(
      `COPY reviews.temp (id, name, slogan, description, category, default_price)
       FROM '/home/tannerhebert/hackreactorhub/SDC/CSV_FILES/product.csv'
       DELIMITER ','
       CSV HEADER;`
    );

    console.log(logT(), 'Copying from temp to products');
    await pool.query(
      `INSERT into reviews.products (id) SELECT id FROM reviews.temp;`
    );
    await pool.query(`DROP TABLE reviews.temp;`);
    console.log(
      logT(),
      'Copying characteristics csv into characteristics table...'
    );
    await client.query(
      `COPY reviews.characteristics_csv (id, product_id, name)
       FROM '/home/tannerhebert/hackreactorhub/SDC/CSV_FILES/characteristics.csv'
       DELIMITER ','
       CSV HEADER;`
    );

    console.log(logT(), 'Copying characteristic reviews csv into cr table...');
    await client.query(
      `COPY reviews.characteristics_reviews_csv (
         id, characteristic_id, review_id, value
       )
       FROM '/home/tannerhebert/hackreactorhub/SDC/CSV_FILES/characteristic_reviews.csv'
       DELIMITER ','
       CSV HEADER;`
    );

    console.log(logT(), 'Copying reviews csv into reviews table...');
    await client.query(
      `COPY reviews.reviews (
         id, product_id, rating, created_at, summary, body,
         recommended, reported, name, email, response, helpful
       )
       FROM '/home/tannerhebert/hackreactorhub/SDC/CSV_FILES/reviews.csv'
       DELIMITER ','
       CSV HEADER;`
    );

    console.log(logT(), 'Copying photos csv into photos table...');
    await client.query(
      `COPY reviews.photos (id, review_id, url)
       FROM '/home/tannerhebert/hackreactorhub/SDC/CSV_FILES/reviews_photos.csv'
       DELIMITER ','
       CSV HEADER;`
    );

    // console.log('Adding foreign keys and setting timestamps...');
    // await client.query(
    //   `ALTER TABLE reviews.photos
    //    ADD CONSTRAINT fk_review_photos_reviews
    //    FOREIGN KEY ( review_id )
    //    REFERENCES "reviews".reviews( id );`
    // );

    // await client.query(
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
