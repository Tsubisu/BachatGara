const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().max(100).required(),
  type: Joi.string().valid('cash', 'bank', 'wallet', 'other').required(),
  currency: Joi.string().max(10).default('NPR'),
  balance: Joi.number().min(0).default(0),
  account_mask: Joi.string().max(50).allow(null, '').optional(),
});

const update = Joi.object({
  name: Joi.string().max(100).optional(),
  type: Joi.string().valid('cash', 'bank', 'wallet', 'other').optional(),
  currency: Joi.string().max(10).optional(),
  balance: Joi.number().min(0).optional(),
  account_mask: Joi.string().max(50).allow(null, '').optional(),
}).min(1);

module.exports = { create, update };
