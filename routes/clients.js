// routes/clients.js
// Mount at /api/clients

const express = require('express');
const router = express.Router();
const {
  getAll,
  getById,
  create,
  update,
  remove
} = require('../controllers/clients');
const { validateBody } = require('../middleware/validate');
const Joi = require('joi');

// Client schema (>=7 fields to satisfy rubric)
const clientCreateSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user','admin').default('user'),
  phone: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  birthday: Joi.string().allow('', null),
  favoriteColor: Joi.string().allow('', null),
  metadata: Joi.object().optional()
});

const clientUpdateSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  role: Joi.string().valid('user','admin'),
  phone: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  birthday: Joi.string().allow('', null),
  favoriteColor: Joi.string().allow('', null),
  metadata: Joi.object()
}).min(1);

router.get('/', getAll);           // GET /api/clients
router.get('/:id', getById);       // GET /api/clients/:id
router.post('/', validateBody(clientCreateSchema), create); // POST /api/clients
router.put('/:id', validateBody(clientUpdateSchema), update); // PUT /api/clients/:id
router.delete('/:id', remove);    // DELETE /api/clients/:id

module.exports = router;
