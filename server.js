// server.js
// App entrypoint. Loads env, connects to DB, mounts routes and error handler.

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('./db/connect');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const port = process.env.PORT || 8083;
const app = express();

app
  .use(bodyParser.json())
  // very small CORS helper: allows all origins (for development). Tighten this in production.
  .use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  })
  .use('/', routes);

// 404 handler
app.use((req, res, next) => res.status(404).json({ error: 'Not Found' }));

// Central error handler
app.use(errorHandler);

// Initialize the database connection, then start the server only if DB init succeeds.
mongodb.initDb((err) => {
  if (err) {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
  } else {
    app.listen(port, () => console.log(`mypadifood API listening on ${port}`));
  }
});
