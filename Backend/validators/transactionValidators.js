const Joi = require('joi');

const addManual = Joi.object({
  description: Joi.string().max(500).required(),
  amount: Joi.number().min(0.01).required(),
  type: Joi.string().valid('income', 'expense').required(),
  category_name: Joi.string().max(100).allow(null, '').optional(),
  account_name: Joi.string().max(100).allow(null, '').optional(),
  date: Joi.string().isoDate().optional(),
});

module.exports = { addManual };
