/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const rateLimit = require('express-slow-down');
const cookieParser = require('cookie-parser');

require('dotenv').config();

// set up express
const app = express();

require('./config/database');
require('./models/userModel');
require('./models/userCollectionModel');
require('./config/passport');

app.use(passport.initialize());
app.use(express.json());
app.use(cookieParser());

const speedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: 500,
});

if (!process.env.PRODUCTION) {
  console('SpeedLimiter enabled');
  app.use((req, res, next) => {
    setTimeout(next, 500);
  });
  app.use(speedLimiter);
} else {
  app.use((req, res, next) => {
    setTimeout(next, 50);
  });
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
}

// set up routes

app.use('/api/auth', require('./routes/auth'));
app.use('/api/account', require('./routes/account'));
app.use('/api/collection', require('./routes/userCollection'));

app.use((err) => {
  if (err) {
    console.log('Wystąpił bląd: ', err);
    return err;
  }
  return 'Some error';
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Serwer running on port: ${PORT}`));
