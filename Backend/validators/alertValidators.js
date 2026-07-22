const Joi = require('joi');

const sync = Joi.object({
  sender: Joi.string().max(50).required(),
  body: Joi.string().required(),
  timestamp: Joi.string().optional().allow(null, ''),
});

const resolve = Joi.object({
  description: Joi.string().max(500).required(),
  category_name: Joi.string().max(100).allow(null, '').optional(),
  is_transfer: Joi.boolean().default(false),
  dest_account_id: Joi.string().uuid().allow(null).optional(),
  service_fee: Joi.number().min(0).default(0),
});

module.exports = { sync, resolve };
