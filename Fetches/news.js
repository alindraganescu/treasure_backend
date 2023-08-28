const axios = require('axios');

const newsData = async (page = 0) => {
  let response = await axios.get(
    // `https://newsdata.io/api/1/news?apikey=${process.env.NewsApiKey}&language=en&q=cryptocurrency&page=${page}`
    // The crypto news is not acccessible with the free API key anymore, so we are getting the general news instead
    `https://newsdata.io/api/1/news?apikey=${process.env.NewsApiKey}&language=en&q=cryptocurrency`
  );
  return response.data;
};

module.exports = newsData;
