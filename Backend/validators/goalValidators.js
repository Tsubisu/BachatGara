const Joi = require('joi');

const createGoal = Joi.object({
  name: Joi.string().max(255).required(),
  target_amount: Joi.number().min(1).required(),
  target_date: Joi.string().isoDate().allow(null, '').optional(),
});

const fundGoal = Joi.object({
  source_account_id: Joi.string().uuid().required(),
  amount: Joi.number().min(0.01).required(),
});

module.exports = { createGoal, fundGoal };
