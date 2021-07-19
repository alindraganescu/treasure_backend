const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

const coinGecko = async () => {
  let data = await CoinGeckoClient.coins.markets();
  return data;
};

module.exports = coinGecko;
