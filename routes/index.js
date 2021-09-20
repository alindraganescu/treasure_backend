var express = require('express');
var router = express.Router();
const app = require('../app');
const getCoinGeckoData = require('../Fetches/coingecko');
const getNewsData = require('../Fetches/news');
// const newsData = require('../data.json'); //news comming from my file, not from API
const db = require('../database/client');
const axios = require('axios');
const sendEmail = require('../services/mailer');

/* Send home page for frontend. */
router.get('/home', async function (req, res, next) {
  const { newsPage } = req.query;
  const coinGeckoData = await getCoinGeckoData();
  const newsData = await getNewsData(newsPage); //the news comming from API

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
    const { user_id, link, description } = req.body;
    const createLink = {
      text: `
            INSERT INTO links (user_id, link, description)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
      values: [user_id, link, description],
    };

    const { rows: linksData } = await db.query(createLink);

    res.status(201).json(linksData[0]);
  } catch (e) {
    res.sendStatus(500);
  }
});

//Add/Update a coin for user:
router.post('/coins', async (req, res) => {
  const { user_id, coin_id, quantity, coin_value, value } = req.body;
  try {
    const findCoin = {
      text: `
      SELECT * 
      FROM coins_owned 
      WHERE user_id=$1
      AND coin_id=$2
      `,
      values: [user_id, coin_id],
    };

    const { rows: findCoinData } = await db.query(findCoin);

    if (!findCoinData.length) {
      const addCoin = {
        text: `
            INSERT INTO coins_owned (user_id, coin_id, quantity, coin_value, value)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
        values: [user_id, coin_id, quantity, coin_value, value],
      };

      const { rows: coinsData } = await db.query(addCoin);

      res.status(201).json(coinsData[0]);
    } else {
      const updateCoin = {
        text: `
        UPDATE coins_owned
        SET quantity=$1, coin_value=$4, value=$5
        WHERE user_id=$2
        AND coin_id=$3 
        RETURNING *
        `,
        values: [quantity, user_id, coin_id, coin_value, value],
      };

      const { rows: updatedCoinData } = await db.query(updateCoin);

      res.status(200).json(updatedCoinData[0]);
    }
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  }
});



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


//Delete a link of the user
router.delete('/links/:link_id/:user_id', (req, res) => {
  const { link_id, user_id } = req.params;

  const deleteLinks = {
    text: 'DELETE FROM links WHERE id=$1 AND user_id=$2 RETURNING *',
    values: [link_id, user_id],
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
router.delete('/coins/:coin_id/:user_id', (req, res) => {
  const { coin_id, user_id } = req.params;

  const deleteOneCoin = {
    text: 'DELETE FROM coins_owned WHERE coin_id=$1 AND user_id=$2 RETURNING *',
    values: [coin_id, user_id],
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


//************************************Retrieve all the database of the user:**********************

// Get all the data
router.get('/alldata/:id', async (req, res) => {
  const { id } = req.params;

  const getOneUser = {
    text: 'SELECT id, username, email from users WHERE id = $1;',
    values: [id],
  };

  const getCoins = {
    text: 'SELECT id, coin_id, quantity, coin_value, value from coins_owned WHERE user_id = $1;',
    values: [id],
  };

  const getAlerts = {
    text: 'SELECT id, coin_id, trigger_value, coin_symbol, crypto_currency_alerting_id from price_alert WHERE user_id = $1;',
    values: [id],
  };

  const getLinks = {
    text: 'SELECT id, user_id, link, description from links WHERE user_id = $1;',
    values: [id],
  };

  try {
    const { rows: userRows } = await db.query(getOneUser);
    const { rows: coinRows } = await db.query(getCoins);
    const { rows: alertRows } = await db.query(getAlerts);
    const { rows: linksRows } = await db.query(getLinks);

    const result = {
      ...userRows[0],
      coins: coinRows,
      alerts: alertRows,
      links: linksRows,
    };

    res.json(result);
  } catch (e) {
    res.json({
      status: 500,
      message: e.message,
    });
  }

  // db.query(getAllData)
  //   .then((data) => {
  //     if (!data.rows.length) return res.send('This user does not exist.');
  //     res.json(data.rows);
  //   })
  //   .catch((err) => console.error(err));

});

//We receive the alert from the Alerting service:

router.post('/cryptocurrencyalerting', async (req, res) => {
  try {
    console.log(req.body);

    // const alert = {
    //   type: "price",
    //   message: "Ethereum (ETH) went above 550.00 USD on Binance.",
    //   currency: "ETH",
    //   direction: "above",
    //   price: "550.00",
    //   target_currency: "USD",
    //   exchange: "Binance"
    // }

    const alert = req.body

    const findUsersByAlert = {
      text: `
      SELECT u.email, u.username
      FROM users u
      JOIN price_alert pa
      on pa.user_id = u.id
      WHERE coin_symbol = $1
      AND $2 ${alert.direction === "above" ? ">=" : "<="} pa.trigger_value
    `,
      values: [alert.currency, alert.price]
    }

    const { rows: userRows} = await db.query(findUsersByAlert)

    if (userRows.length) {

      const userEmailSendingPromise = userRows.map(async (user) => {
       return await sendEmail(
          user.email,
          `Your alert for ${alert.currency} has been triggered ${user.username}!`,
          alert.message,
          `<h1>${alert.message}</h1>`
        );
      })

      const results = await Promise.all(userEmailSendingPromise)

      res.json(results);
    }

    res.json(userRows)

    

    // price_alert
    // id	user_id	coin_id	  trigger_value	coin_symbol	crypto_currency_alerting_id
    // 21	   1	   ethereum	  500	           ETH	          801013

    // users
    // id	username	password	email
    // 1	alinut	bitcoin	alin@gmail.com



    // res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});

router.post('/send-email', async (req, res) => {
  //   to,
  //   subject,
  //   text,
  //   html,
  try {
    const result = await sendEmail(
      'someone@something.com',
      'Good job, Ben!',
      'You made it work.',
      '<h1>You made it work.</h1>'
    );

    res.json(result);
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  }
});

router.post('/alerts', async (req, res) => {
  const { currency, price, direction, user_id, coin_id } = req.body;

  try {
    const url = 'https://api.cryptocurrencyalerting.com/v1/alert-conditions/';

     const alertData = {
      type: "price",
      currency, // Eg: ETH => one of https://cryptocurrencyalerting.com/coins.html
      target_currency: "USD",
      price, // Should be a string (eg: "500")
      direction, // Eg: 'above' or 'below'
      channel: { name: "webhook" },
      exchange: "Binance",
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

//****************************************************************************

module.exports = router;
