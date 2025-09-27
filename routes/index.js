// routes/index.js
// Central place to mount all API routes and docs.

const express = require('express');
const router = express.Router();

const clients = require('./clients');
const vendors = require('./vendors');
const authRoutes = require('./auth'); // new auth router
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json'); // generate with swagger-autogen

const { ensureAuthenticated } = require('../middleware/auth');

// Mount auth routes at /auth
router.use('/auth', authRoutes);

// Public api routes (you may decide which routes require auth)
router.use('/api/clients', clients);
router.use('/api/vendors', vendors);

// Protected example: return currently logged in user profile
router.get('/api/profile', ensureAuthenticated, (req, res) => {
  // req.user is populated by passport.deserializeUser
  res.json({ user: req.user });
});

// Basic Swagger UI at /api-docs
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
