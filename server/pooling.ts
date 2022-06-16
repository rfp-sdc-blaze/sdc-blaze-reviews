import { Pool } from 'pg';
require('dotenv').config();

export const pool = new Pool({
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  port: Number(process.env.PORT)
});

export async function getClient() {
  try {
    const client = await pool.connect();
    console.log('Connected');
    const query = client.query;
    const release = client.release;

    client.release = () => {
      client.query = query;
      client.release = release;
      return release.apply(client);
    };
    return client;
  } catch (e) {
    return false;
  }
}
