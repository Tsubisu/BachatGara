const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().max(255).required(),
  amount: Joi.number().min(0).required(),
  billing_cycle: Joi.string().valid('monthly', 'yearly').required(),
  next_billing_date: Joi.string().isoDate().required(),
  account_id: Joi.string().uuid().allow(null).optional(),
});

module.exports = { create };
