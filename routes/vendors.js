// routes/vendors.js
// Mount at /api/vendors

const express = require('express');
const router = express.Router();
const {
  getAll,
  getById,
  create,
  update,
  remove
} = require('../controllers/vendors');
const { validateBody } = require('../middleware/validate');
const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  foodItem: Joi.string().required(),
  price: Joi.number().positive().required(),
  location: Joi.object({
    address: Joi.string().allow('', null),
    lat: Joi.number().optional(),
    lng: Joi.number().optional()
  }).optional()
});

const updateSchema = createSchema.fork(['name', 'email', 'foodItem', 'price'], (s) => s.optional()).min(1);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validateBody(createSchema), create);
router.put('/:id', validateBody(updateSchema), update);
router.delete('/:id', remove);

module.exports = router;
