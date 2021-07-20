var express = require('express');
var router = express.Router();
const app = require('../app');
const coinGeckoData = require('../Fetches/coingecko');
// const newsData = require('../Fetches/news');
const newsData = require('../data.json');

/* GET home page. */
router.get('/home', async function (req, res, next) {
  let data = await coinGeckoData();
  // let data2 = await newsData();

  // res.json({ coinGecko: data, news: data2 });
  res.json({ coinGecko: data, news: newsData });
});

module.exports = router;
