// middleware/validate.js

const Joi = require('joi');

const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    // send validation errors in a predictable format
    return res.status(400).json({ errors: error.details.map(d => d.message) });
  }
  req.body = value;
  next();
};

module.exports = { validateBody };
