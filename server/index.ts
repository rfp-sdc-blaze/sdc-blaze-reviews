require('dotenv').config();
import { getProductReview, getReviewMeta } from '../db/index';
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
  //These are all catching bad data and returning 400s before any DB queries happen
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
  let page = 1;
  if ('page' in req.query) {
    if (isNaN(Number(req.query.page))) {
      console.log('broken page');
      res.sendStatus(400);
      return;
    }
    page = Number(req.query.page);
  }
  let sort: SortTypes = SortTypes.None;
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
  const offset = 5;

  //This is the actual call to the DB if the request is appropriately structured
  const productReview = await getProductReview(productId, count, offset, page);
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
export const server = app.listen(PORT, (): void => {
  console.log(`Listening on port ${PORT}`);
});
