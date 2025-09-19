// routes/index.js
// Central place to mount all API routes and docs.

const express = require('express');
const router = express.Router();
const clients = require('./clients');
const vendors = require('./vendors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json'); // generate with swagger-autogen

router.use('/api/clients', clients);
router.use('/api/vendors', vendors);

// Basic Swagger UI at /api-docs
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
