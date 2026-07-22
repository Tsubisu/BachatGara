const authService = require('../services/authService');
const { catchAsync } = require('../middleware/errorHandler');

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});

const verifyEmail = catchAsync(async (req, res) => {
  const result = await authService.verifyEmailOtp(req.body);
  res.status(200).json(result);
});

const resendOtp = catchAsync(async (req, res) => {
  const result = await authService.resendVerificationOtp(req.body);
  res.status(200).json(result);
});

const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body);
  res.status(200).json(result);
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.status(200).json(result);
});

const verifyResetOtpOnly = catchAsync(async (req, res) => {
  const result = await authService.verifyPasswordResetOtp(req.body);
  res.status(200).json(result);
});

module.exports = {
  register,
  login,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
  verifyResetOtpOnly,
};

