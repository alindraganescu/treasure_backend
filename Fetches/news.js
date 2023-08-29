// const axios = require('axios');

// const newsData = async (page = 0) => {
//   let response = await axios.get(
//     // `https://newsdata.io/api/1/news?apikey=${process.env.NewsApiKey}&language=en&q=cryptocurrency&page=${page}`
//     // The crypto news is not acccessible with the free API key anymore, so we are getting the general news instead
//     `https://newsdata.io/api/1/news?apikey=${process.env.NewsApiKey}&language=en&q=cryptocurrency`
//   );
//   return response.data;
// };

// module.exports = newsData;

const axios = require('axios');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

let nextPage = ''; // Variable to store nextPage string

const fetchInitialNews = async () => {
  let url = `https://newsdata.io/api/1/news?apikey=${process.env.NewsApiKey}&language=en&q=cryptocurrency`;
  const response = await axios.get(url);
  nextPage = response.data.nextPage; // Save nextPage
  return response.data;
};

const fetchNextNews = async () => {
  let url = `https://newsdata.io/api/1/news?apikey=${process.env.NewsApiKey}&language=en&q=cryptocurrency&page=${nextPage}`;
  const response = await axios.get(url);
  nextPage = response.data.nextPage; // Update nextPage
  return response.data;
};

module.exports = { fetchInitialNews, fetchNextNews, nextPage };
