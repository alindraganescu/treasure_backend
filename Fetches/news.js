const axios = require('axios');

const newsData = async () => {
  let response = await axios.get(
    `https://newsdata.io/api/1/news?apikey=${process.env.NewsApiKey}&language=en&q=cryptocurrency`
  );
  return response.data;
};

module.exports = newsData;
