require('dotenv').config();
import { getProductReview, getReviewMeta } from '../db/index';
import { addReview, report, helpful } from '../db/writes';
// import { getReviewMeta } from '../db/index';
//import { getReviewMetaJS } from '../db/index.js';
import express from 'express';
const PORT = process.env.PORT || 3002;
const app = express();

// app.listen(3001, ():void => {
//     console.log("started");
// });

app.use(express.json());

enum SortTypes {
  Newest = 'newest',
  Helpful = 'helpful',
  Relevant = 'relevant',
  None = 'none'
}

//GET route to the reviews object response
app.get(`/reviews/`, async (req, res) => {
  // These are all catching bad data and returning 400s before any DB queries happen
  if (isNaN(Number(req.query.product_id))) {
    console.log('Broken ID');
    res.sendStatus(400);
    return;
  }
  const productId = Number(req.query.product_id);
  let count = 5;
  if ('count' in req.query) {
    if (isNaN(Number(req.query.count))) {
      console.log('broken count');
      res.sendStatus(400);
      return;
    }
    count = Number(req.query.count);
  }
  let page = 0;
  if ('page' in req.query) {
    if (isNaN(Number(req.query.page))) {
      console.log('broken page');
      res.sendStatus(400);
      return;
    }
    page = Number(req.query.page);
  }
  let sort: SortTypes = SortTypes.Helpful;
  if (sort in req.query) {
    switch (req.query.sort) {
      case SortTypes.Newest:
        sort = SortTypes.Newest;
        break;
      case SortTypes.Relevant:
        sort = SortTypes.Relevant;
        break;
      case SortTypes.Helpful:
        sort = SortTypes.Helpful;
        break;
      default:
        console.log('broken sort');
        res.sendStatus(400);
        return;
    }
  }

  const offset = (page - 1) * count;

  //This is the actual call to the DB if the request is appropriately structured
  const productReview = await getProductReview(
    productId,
    sort,
    count,
    offset,
    page
  );
  if (productReview === false) {
    res.sendStatus(400);
  } else {
    res.send(productReview).status(200);
  }
});

//GET route to the reviews metadata

// app.get(`/reviews/meta`, async (req, res) => {
//   if (isNaN(Number(req.query.product_id))) {
//     res.sendStatus(400);
//     return;
//   }
//   const productId = Number(req.query.product_id);
//   const reviewMeta = await getReviewMeta(productId);
//   if (reviewMeta === false) {
//     res.sendStatus(400);
//   } else {
//     res.send(reviewMeta).status(200);
//   }
// });

app.get(`/reviews/meta`, async (req, res) => {
  if (isNaN(Number(req.query.product_id))) {
    res.sendStatus(400);
    return;
  }
  const productId = Number(req.query.product_id);
  const reviewMeta = await getReviewMeta(productId);
  if (reviewMeta === false) {
    res.sendStatus(400);
  } else {
    res.send(reviewMeta).status(200);
  }
});

app.post(`/reviews`, async (req, res) => {
  //console.log(req.body);
  await addReview(req.body);

  res.sendStatus(200);
});

app.put(`/reviews/:review_id/report`, async (req, res) => {
  const review_id = Number(req.params.review_id);
  //console.log(review_id);
  await report(review_id);
  res.sendStatus(204);
});
app.put(`/reviews/:review_id/helpful`, async (req, res) => {
  const review_id = Number(req.params.review_id);
  //.console.log(review_id);
  await helpful(review_id);
  res.sendStatus(204);
});

app.get('/loaderio-6a14faf9c059a162338a3bfbd2e58be4', (req, res) => {
  res.status(200).send('loaderio-6a14faf9c059a162338a3bfbd2e58be4');
});
export const server = app.listen(PORT, (): void => {
  console.log(`Listening on port ${PORT}`);
});
