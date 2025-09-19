// helpers/validate.js
const Validator = require('validatorjs');

const validator = (body, rules, customMessages, callback) => {
  // create a Validator instance with the provided data and rules
  const validation = new Validator(body, rules, customMessages);

  // if all rules pass, call the callback with (null, true)
  validation.passes(() => callback(null, true));

  // if validation fails, call the callback with (validation.errors, false)
  // validation.errors contains detailed messages; use .all() to get an object of arrays
  validation.fails(() => callback(validation.errors, false));
};

module.exports = validator;

