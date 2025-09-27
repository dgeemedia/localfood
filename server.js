// server.js
// App entrypoint. Loads env, connects to DB, mounts routes and error handler.
// Session + Passport middleware are registered AFTER DB init to ensure
// session store (connect-mongo) can connect to the same MongoDB instance.

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

const mongodb = require('./db/connect'); // our existing helper
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const port = process.env.PORT || 8083;
const app = express();

// Basic global middleware (safe to register before DB init)
app.use(helmet()); // security headers
app.use(cors()); // dev: allows cross-origin (tighten in prod)
app.use(bodyParser.json()); // parse JSON bodies
app.use(cookieParser()); // parse cookies

// load passport strategies (this file will call passport.use())
require('./auth/passport-github'); // <-- new file below (registers strategy)

// Initialize DB first, then session & passport, then routes & server
mongodb.initDb((err) => {
  if (err) {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
  }

  // Create express-session with Mongo session store.
  // We use the MONGODB_URI so connect-mongo creates its own connection.
  app.use(session({
    name: 'mypadifood.sid', // cookie name
    secret: process.env.SESSION_SECRET, 
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      // secure: true // enable when using https
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI, // connect-mongo will use this URI
      collectionName: 'sessions'
      // ttl: 14 * 24 * 60 * 60 // optional
    })
  }));

  // Initialize passport now that sessions exist
  app.use(passport.initialize());
  app.use(passport.session());

  // Mount application routes (auth, api, docs)
  app.use('/', routes);

  // 404 handler (after routes)
  app.use((req, res, next) => res.status(404).json({ error: 'Not Found' }));

  // Central error handler
  app.use(errorHandler);

  // Start server
  app.listen(port, () => console.log(`mypadifood API listening on ${port}`));
});
