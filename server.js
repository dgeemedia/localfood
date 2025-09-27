// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

const mongodb = require('./db/connect');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const port = process.env.PORT || 8083;
const app = express();

// Basic global middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true })); // dev: allow all origins; tighten in prod
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// load passport strategies (this file calls passport.use(...))
require('./auth/passport-github');

// Initialize DB first, then session & passport, then routes & server
mongodb.initDb((err) => {
  if (err) {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
  }

  app.use(session({
    name: process.env.SESSION_COOKIE_NAME || 'mypadifood.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions'
    })
  }));

  // passport must be initialized after sessions
  app.use(passport.initialize());
  app.use(passport.session());

  // mount routes and docs
  app.use('/', routes);

  // 404 handler
  app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

  // central error handler
  app.use(errorHandler);

  app.listen(port, () => console.log(`mypadifood API listening on ${port}`));
});
