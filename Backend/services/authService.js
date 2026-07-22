const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepository');
const otpService = require('./otpService');
const AppError = require('../utils/AppError');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is not defined!');
  }
  console.warn('WARNING: JWT_SECRET environment variable is not defined. Falling back to an insecure development key.');
}
const ACTUAL_SECRET = JWT_SECRET || 'dev_insecure_jwt_secret_fallback_key';

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, ACTUAL_SECRET, { expiresIn: '7d' });

const register = async ({ email, password, name }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new AppError('An account with this email already exists.', 400);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepo.create(email, passwordHash, name);

  // Send registration OTP
  await otpService.sendOtp(email, 'email_verification');

  return {
    message: 'Registration successful. An OTP has been sent to your email to verify your account.',
    user: { id: user.id, email: user.email, profile_name: user.profile_name, is_verified: false }
  };
};

const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError('Invalid email or password.', 401);

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  if (!user.is_verified) {
    // Try sending a new OTP since they are not verified
    try {
      await otpService.sendOtp(email, 'email_verification');
    } catch (e) {
      // Ignore rate limit error during login so we can still throw EMAIL_NOT_VERIFIED
    }
    throw new AppError('EMAIL_NOT_VERIFIED', 403);
  }

  const token = signToken(user);
  return {
    token,
    user: { id: user.id, email: user.email, profile_name: user.profile_name, is_verified: true },
  };
};

const verifyEmailOtp = async ({ email, code }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError('User not found.', 404);
  if (user.is_verified) throw new AppError('Email is already verified.', 400);

  const isValid = await otpService.verifyOtp(email, code, 'email_verification');
  if (!isValid) throw new AppError('Invalid or expired OTP code.', 400);

  // Mark as verified
  const updatedUser = await userRepo.updateById(user.id, { is_verified: true });

  const token = signToken(updatedUser);
  return {
    message: 'Email verified successfully.',
    token,
    user: { id: updatedUser.id, email: updatedUser.email, profile_name: updatedUser.profile_name, is_verified: true }
  };
};

const resendVerificationOtp = async ({ email, purpose }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError('User not found.', 404);
  if (purpose === 'email_verification' && user.is_verified) {
    throw new AppError('Email is already verified.', 400);
  }

  await otpService.sendOtp(email, purpose);
  return { message: 'Verification code resent successfully.' };
};

const requestPasswordReset = async ({ email }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    // Security best practice: Do not disclose if account exists
    return { message: 'If the email matches an account, a password reset code has been sent.' };
  }

  await otpService.sendOtp(email, 'password_reset');
  return { message: 'If the email matches an account, a password reset code has been sent.' };
};

const resetPassword = async ({ email, code, newPassword }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError('User not found.', 404);

  const isValid = await otpService.verifyOtp(email, code, 'password_reset');
  if (!isValid) throw new AppError('Invalid or expired OTP code.', 400);

  // Update password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  // Resetting password also forces email verification if they were not verified yet
  await userRepo.updateById(user.id, { password_hash: newPasswordHash, is_verified: true });

  return { message: 'Password has been reset successfully. You can now login.' };
};

const verifyPasswordResetOtp = async ({ email, code }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError('User not found.', 404);

  const isValid = await otpService.checkOtp(email, code, 'password_reset');
  if (!isValid) throw new AppError('Invalid or expired OTP code.', 400);

  return { message: 'OTP code verified successfully.' };
};

module.exports = {
  register,
  login,
  verifyEmailOtp,
  resendVerificationOtp,
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetOtp,
};

