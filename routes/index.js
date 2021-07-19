var express = require('express');
var router = express.Router();
const coinGeckoData = require('../Fetches/coingecko');

/* GET home page. */
router.get('/home', async function (req, res, next) {
  let data = await coinGeckoData();
  // let data2 = await coinGeckoData2();
  res.send(data);
});

module.exports = router;
