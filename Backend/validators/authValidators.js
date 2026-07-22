const Joi = require('joi');

const register = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().max(100).optional(),
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifyEmail = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

const resendOtp = Joi.object({
  email: Joi.string().email().required(),
  purpose: Joi.string().valid('email_verification', 'password_reset').required(),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().required(),
});

const resetPassword = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

module.exports = {
  register,
  login,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
};
