// routes/index.js
const express = require('express');
const router = express.Router();

const clients = require('./clients');
const vendors = require('./vendors');
const authRoutes = require('./auth');
const swaggerUi = require('swagger-ui-express');

let swaggerDocument = {};
try {
  swaggerDocument = require('../swagger.json');
} catch (err) {
  console.warn('swagger.json not found; run `npm run swagger` to generate it.');
}

// server base used for swagger oauth redirect (should match SWAGGER_LOCAL)
const SERVER_BASE = (process.env.SWAGGER_LOCAL || `http://localhost:${process.env.PORT || 8083}`).replace(/\/+$/, '');
const SWAGGER_OAUTH_REDIRECT = `${SERVER_BASE}/api-docs/oauth2-redirect.html`;

// Swagger UI options: tell UI where to redirect and provide clientId
const swaggerUiOptions = {
  swaggerOptions: {
    oauth2RedirectUrl: SWAGGER_OAUTH_REDIRECT,
    initOAuth: {
      clientId: process.env.GITHUB_CLIENT_ID || ''
      // DO NOT put clientSecret here
    }
  }
};

// mount auth first so /auth/start-oauth and /auth/github/callback exist
router.use('/auth', authRoutes);

// public API routes
router.use('/api/clients', clients);
router.use('/api/vendors', vendors);

// simple protected example (uses passport session)
const { ensureAuthenticated } = require('../middleware/auth');
router.get('/api/profile', ensureAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

// swagger UI
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUiOptions));

module.exports = router;
