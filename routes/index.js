var express = require('express');
var router = express.Router();
const app = require('../app');
const getCoinGeckoData = require('../Fetches/coingecko');
// const getNewsData = require('../Fetches/news');
const newsData = require('../data.json');

/* GET home page. */
router.get('/home', async function (req, res, next) {
  const { newsPage } = req.query;
  const coinGeckoData = await getCoinGeckoData();
  // const newsData = await getNewsData(newsPage);

  // res.json({ coinGecko: data, news: data2 });
  res.json({ coinGeckoData, newsData });
});

module.exports = router;
