var express = require('express');
var router = express.Router();
const app = require('../app');
const getCoinGeckoData = require('../Fetches/coingecko');
// const getNewsData = require('../Fetches/news');
const newsData = require('../data.json');
const db = require('../database/client');
const axios = require('axios');

/* Send home page for frontend. */
router.get('/home', async function (req, res, next) {
  const { newsPage } = req.query;
  const coinGeckoData = await getCoinGeckoData();
  // const newsData = await getNewsData(newsPage);

  // res.json({ coinGecko: data, news: data2 });
  res.json({ coinGeckoData, newsData });
});

//**************************************GET ROUTES SQL DATABASE ************************/

// Testing connection with database
// router.get('/time', async (_req, res) => {
//   try {
//     const { rows } = await db.query('SELECT NOW()');
//     res.send(rows[0].now);
//   } catch (e) {
//     res.sendStatus(500);
//   }
// });

// Get all the users
router.get('/user', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT * from users ORDER BY id ASC;');
    res.json(rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

// Get a user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const getOneUser = {
      text: 'SELECT * from users WHERE id = $1;',
      values: [id],
    };
    const { rows } = await db.query(getOneUser);
    if (!rows.length) {
      return res.status(404).send('No user found for this id');
    }
    res.json(rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

// Get links of the user
router.get('/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const getLinks = {
      text: 'SELECT * from links WHERE user_id = $1;',
      values: [id],
    };
    const { rows } = await db.query(getLinks);
    if (!rows.length) {
      return res.status(404).send('No links found for this user');
    }
    res.json(rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

// Get coins of the user
router.get('/coins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const getCoins = {
      text: 'SELECT * from coins_owned WHERE user_id = $1;',
      values: [id],
    };
    const { rows } = await db.query(getCoins);
    if (!rows.length) {
      return res.status(404).send('No coins found for this user');
    }
    res.json(rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

// Get price alerts of the user
router.get('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const getAlerts = {
      text: 'SELECT * from price_alert WHERE user_id = $1;',
      values: [id],
    };
    const { rows } = await db.query(getAlerts);
    if (!rows.length) {
      return res.status(404).send('No alerts found for this user');
    }
    res.json(rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

//**************************************POST ROUTES SQL DATABASE******************************************

//Create a user into database
router.post('/user', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const createOneUser = {
      text: `
            INSERT INTO users (username, password, email)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
      values: [username, password, email],
    };

    const { rows: userData } = await db.query(createOneUser);

    res.status(201).json(userData[0]);
  } catch (e) {
    res.sendStatus(500);
  }
});

//Create a link
router.post('/links', async (req, res) => {
  try {
    const { user_id, link } = req.body;
    const createLink = {
      text: `
            INSERT INTO links (user_id, link)
            VALUES ($1, $2)
            RETURNING *
            `,
      values: [user_id, link],
    };

    const { rows: linksData } = await db.query(createLink);

    res.status(201).json(linksData[0]);
  } catch (e) {
    res.sendStatus(500);
  }
});

//Add a coin for user:
router.post('/coins', async (req, res) => {
  try {
    const { user_id, coin_id, quantity } = req.body;
    const addCoin = {
      text: `
            INSERT INTO coins_owned (user_id, coin_id, quantity)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
      values: [user_id, coin_id, quantity],
    };

    const { rows: coinsData } = await db.query(addCoin);

    res.status(201).json(coinsData[0]);
  } catch (e) {
    res.sendStatus(500);
  }
});

//Add a price alert:
// router.post('/alerts', async (req, res) => {
//   try {
//     const { user_id, coin_id, trigger_value } = req.body;
//     const addAlert = {
//       text: `
//             INSERT INTO price_alert (user_id, coin_id, trigger_value)
//             VALUES ($1, $2, $3)
//             RETURNING *
//             `,
//       values: [user_id, coin_id, trigger_value],
//     };

//     const { rows: alertsData } = await db.query(addAlert);

//     res.status(201).json(alertsData[0]);
//   } catch (e) {
//     res.sendStatus(500);
//   }
// });

//**************************************DELETE ROUTES SQL DATABASE******************************************

//Delete a user
router.delete('/user/:id', (req, res) => {
  const { id } = req.params;

  const deleteOneUser = {
    text: 'DELETE FROM users WHERE id=$1 RETURNING *',
    values: [id],
  };

  db.query(deleteOneUser)
    .then((data) => {
      if (!data.rows.length) {
        return res.status(404).send('No such user');
      }
      res.json(data.rows);
    })
    .catch((e) => res.status(500).send(e.message));
});

//Delete a user async/await refactoring:
// router.delete('/user/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleteOneUser = {
//       text: 'DELETE FROM users WHERE id=$1 RETURNING *',
//       values: [id],
//     };
//     const { rows: deletedData } = await db.query(deleteOneUser);
//     res.status(201).json(deletedData); //can I use deletedData all the time? same name for 10 routes inside the function?
//   } catch (e) {
//     res.sendStatus(500).send(e.message);
//   }
// });

//Delete a link of the user
router.delete('/links/:id', (req, res) => {
  const { id } = req.params;

  const deleteLinks = {
    text: 'DELETE FROM links WHERE id=$1 RETURNING *',
    values: [id],
  };

  db.query(deleteLinks)
    .then((data) => {
      if (!data.rows.length) {
        return res.status(404).send('The link does not exist.');
      }
      res.json(data.rows);
    })
    .catch((e) => res.status(500).send(e.message));
});

//Delete all the links of the user
router.delete('/allinks/:id', (req, res) => {
  const { id } = req.params;

  const deleteAllLinks = {
    text: 'DELETE FROM links WHERE user_id=$1 RETURNING *',
    values: [id],
  };

  db.query(deleteAllLinks)
    .then((data) => {
      if (!data.rows.length) {
        return res
          .status(404)
          .send('The user does not have any links to delete.');
      }
      res.json(data.rows);
    })
    .catch((e) => res.status(500).send(e.message));
});

//Delete a coin
router.delete('/coins/:id', (req, res) => {
  const { id } = req.params;

  const deleteOneCoin = {
    text: 'DELETE FROM coins_owned WHERE id=$1 RETURNING *',
    values: [id],
  };

  db.query(deleteOneCoin)
    .then((data) => {
      if (!data.rows.length) {
        return res.status(404).send('No such coin');
      }
      res.json(data.rows);
    })
    .catch((e) => res.status(500).send(e.message));
});

//Delete all the coins of the user
router.delete('/allcoins/:id', (req, res) => {
  const { id } = req.params;

  const deleteAllCoins = {
    text: 'DELETE FROM coins_owned WHERE user_id=$1 RETURNING *',
    values: [id],
  };

  db.query(deleteAllCoins)
    .then((data) => {
      if (!data.rows.length) {
        return res
          .status(404)
          .send('The user does not have any coins to delete.');
      }
      res.json(data.rows);
    })
    .catch((e) => res.status(500).send(e.message));
});

//Delete an alert
router.delete('/alerts/:id', (req, res) => {
  const { id } = req.params;

  const deleteOneAlert = {
    text: 'DELETE FROM price_alert WHERE id=$1 RETURNING *',
    values: [id],
  };

  db.query(deleteOneAlert)
    .then((data) => {
      if (!data.rows.length) {
        return res.status(404).send('No such alert');
      }
      res.json(data.rows);
    })
    .catch((e) => res.status(500).send(e.message));
});

//Delete all the alerts of the user
router.delete('/allalerts/:id', (req, res) => {
  const { id } = req.params;

  const deleteAllAlerts = {
    text: 'DELETE FROM price_alert WHERE user_id=$1 RETURNING *',
    values: [id],
  };

  db.query(deleteAllAlerts)
    .then((data) => {
      if (!data.rows.length) {
        return res
          .status(404)
          .send('The user does not have any alerts to delete.');
      }
      res.json(data.rows);
    })
    .catch((e) => res.status(500).send(e.message));
});

//**************************************PUT ROUTES SQL DATABASE******************************************

//Modify user data:  how can I modify only one value out of the three?
router.put('/user/:id', (req, res) => {
  const { username, password, email } = req.body;
  const { id } = req.params;

  const updateOneUser = {
    text: 'UPDATE users SET username=$1, password=$2, email=$3 WHERE id=$4 RETURNING *',
    values: [username, password, email, id],
  };

  db.query(updateOneUser)
    .then((data) => res.json(data.rows))
    .catch((e) => res.status(500).send(e.message));
});

//Modify user data refactor with async/await

// router.put('/user/:id', async (req, res) => {
//   try {
//   const { username, password, email } = req.body;
//   const { id } = req.params;

//   const updateOneUser = {
//     text: 'UPDATE users SET username=$1, password=$2, email=$3 WHERE id=$4 RETURNING *',
//     values: [username, password, email, id],
//   };

//   const { rows: updatedData } = await db.query(updateOneUser)
//     .then((data) => res.json(data.rows))
//   } catch (e) {
//   res.status(500).send(e.message)}
// });

//************************************Retrieve all the database of the user:**********************

// Get all the data
router.get('/alldata/:id', async (req, res) => {
  const { id } = req.params;

  const getOneUser = {
    text: 'SELECT id, username, email from users WHERE id = $1;',
    values: [id],
  };

  const getCoins = {
    text: 'SELECT id, coin_id, quantity from coins_owned WHERE user_id = $1;',
    values: [id],
  };

  const getAlerts = {
    text: 'SELECT id, coin_id, trigger_value from price_alert WHERE user_id = $1;',
    values: [id],
  };

  try {
    const { rows: userRows } = await db.query(getOneUser);
    const { rows: coinRows } = await db.query(getCoins);
    const { rows: alertRows } = await db.query(getAlerts);

    const result = {
      ...userRows[0],
      coins: coinRows,
      alerts: alertRows,
    };

    res.json(result);
  } catch (e) {
    res.json({
      status: 500,
      message: e.message,
    });
  }

  // const getAllData = {
  //   text: `
  //     SELECT
  //   restaurants.id,
  //   restaurants.name as restaurant,
  //   restaurants.long,
  //   restaurants.lat,
  //   restaurants.image_url,
  //   city.name as city,
  //   tag.name as tag
  // FROM restaurants
  // JOIN city
  //   ON restaurants.city_id=city.id
  // JOIN restaurant_has_tag
  //   ON restaurants.id=restaurant_has_tag.id_restaurant
  // JOIN tag
  //   ON restaurant_has_tag.id_tag=tag.id;
  //     `,
  //   values: [username, password, email, id],
  // };

  // db.query(getAllData)
  //   .then((data) => {
  //     if (!data.rows.length) return res.send('This user does not exist.');
  //     res.json(data.rows);
  //   })
  //   .catch((err) => console.error(err));
});

router.post('/receive-alert', async (req, res) => {
  try {
    console.log(req.body);

    // {
    //   "type": "price",
    //   "message": "ZCash (ZEC) went above 150.00 USD on Gemini.",
    //   "currency": "ZEC",
    //   "direction": "above",
    //   "price": "150.00",
    //   "target_currency": "USD",
    //   "exchange": "Gemini"
    // }

    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});

router.post('/alerts', async (req, res) => {
  const { currency, price, direction, user_id, coin_id } = req.body;

  try {
    const url = 'https://api.cryptocurrencyalerting.com/v1/alert-conditions/';

    const alertData = {
      type: 'price',
      currency, // Eg: ETH => one of https://cryptocurrencyalerting.com/coins.html
      target_currency: 'USD',
      price, // Eg: 45.6
      direction, // Eg: 'above' or 'below'
      channel: { name: 'webhook' },
      exchange: 'Binance',
    };

    const headers = {
      auth: {
        username: process.env.TOKEN_CRYPTOCURRENCY_ALERTING,
        password: null,
      },
    };

    const { data: cryptoCurrencyAlertingRows } = await axios.post(
      url,
      alertData,
      headers
    );

    const addAlert = {
      text: `
            INSERT INTO price_alert (user_id, coin_id, coin_symbol, crypto_currency_alerting_id, trigger_value)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
      values: [
        user_id,
        coin_id,
        currency,
        cryptoCurrencyAlertingRows.id,
        price,
      ],
    };

    const { rows: alertsData } = await db.query(addAlert);

    res.json({
      status: 201,
      message: 'Alert created successfully',
      data: {
        ...cryptoCurrencyAlertingRows,
        ...alertsData[0],
      },
    });
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  }
});

module.exports = router;

//Alert token:
//https://api.cryptocurrencyalerting.com/v1/alert-conditions/
