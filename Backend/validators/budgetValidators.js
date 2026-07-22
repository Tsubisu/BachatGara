const Joi = require('joi');

const createPlan = Joi.object({
  name: Joi.string().max(255).required(),
  start_date: Joi.string().isoDate().required(),
  end_date: Joi.string().isoDate().required(),
  total_pool: Joi.number().min(0).required(),
  allocations: Joi.object().pattern(Joi.string(), Joi.number().min(0)).optional().default({}),
});

const rollover = Joi.object({
  action: Joi.string().valid('savings', 'cash', 'rollover').required(),
  leftover_amount: Joi.number().min(0).required(),
  target_plan_id: Joi.string().uuid().when('action', {
    is: 'rollover',
    then: Joi.required(),
    otherwise: Joi.optional().allow(null),
  }),
});

module.exports = { createPlan, rollover };
