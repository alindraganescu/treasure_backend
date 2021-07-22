const axios = require('axios');

const newsData = async (page = 0) => {
  let response = await axios.get(
    `https://newsdata.io/api/1/news?apikey=${process.env.NewsApiKey}&language=en&q=cryptocurrency&page=${page}`
  );
  return response.data;
};

module.exports = newsData;
