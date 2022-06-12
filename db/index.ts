import { Client, Pool } from 'pg';

interface Photo {
  id: number;
  url: string;
}
interface Review {
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

interface DetailReview extends Review {
  photos: Photo[];
}

interface ReviewHead {
  product: string;
  page: number;
  count: number;
  results: DetailReview[];
}
export async function getProductReview(
  productId: number,
  count: number,
  page: number,
  sort: string
): Promise<ReviewHead | false> {
  const client = new Client({
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD
  });

  try {
    await client.connect();
    const offset = (page - 1) * count;
    const qValues = [count, offset];
    const headerRes = await client.query(
      'SELECT * FROM reviews.reviews ORDER BY id LIMIT $1 OFFSET $2;',
      qValues
    );
    const reviewsRes = await client.query(
      'SELECT [review_id, rating, summary, recommend, response, body, date, reviewer_name, helpfulness] FROM reviews.reviews WHERE product_id = $1;',
      [productId]
    );

    const photosRes = await client.query(
      'SELECT [id, url] FROM reviews.photos WHERE reviews_id = $1',
      [productId]
    );

    const fullReviewRes = {
      ...headerRes.rows[0]
    }; //
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}
