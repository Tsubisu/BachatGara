const Joi = require('joi');

const update = Joi.object({
  profile_name: Joi.string().max(100).optional().allow(null, ''),
  theme: Joi.string().max(50).optional().allow(null, ''),
  net_savings: Joi.number().min(0).optional(),
  email: Joi.string().email().optional(),
  current_password: Joi.string().optional(),
  new_password: Joi.string().min(6).optional(),
})
  .min(1)
  .with('new_password', 'current_password')
  .with('email', 'current_password');

module.exports = { update };
