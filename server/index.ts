require('dotenv').config();
import { getProductReview } from '../db/index';
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

app.get(`/reviews/`, async (req, res) => {
  if (isNaN(Number(req.query.product_id))) {
    res.sendStatus(400);
    return;
  }
  const productId = Number(req.query.product_id);
  let count = 5;
  if ('count' in req.query) {
    if (isNaN(Number(req.query.count))) {
      res.sendStatus(400);
      return;
    }
    count = Number(req.query.count);
  }
  let page = 1;
  if ('page' in req.query) {
    if (isNaN(Number(req.query.page))) {
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
        res.sendStatus(400);
        return;
    }
  }

  const productReview = await getProductReview(productId, count, page, sort);
  if (productReview === false) {
    res.sendStatus(400);
  } else {
    res.send(productReview).status(200);
  }
});

// app.get(`/reviews/meta/?product_id=${prodID}&&count=`, async (req, res) => {});
