const db = require('../db');
const emailService = require('./emailService');
const AppError = require('../utils/AppError');

const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtp = async (email, purpose) => {
  const cleanEmail = email.toLowerCase().trim();

  const recentOtpQuery = await db.query(
    `SELECT created_at FROM otps
     WHERE email = $1 AND purpose = $2
     ORDER BY created_at DESC LIMIT 1`,
    [cleanEmail, purpose]
  );

  if (recentOtpQuery.rows.length > 0) {
    const lastSent = new Date(recentOtpQuery.rows[0].created_at);
    const diffMs = Date.now() - lastSent.getTime();
    if (diffMs < 60000) {
      const remainingSeconds = Math.ceil((60000 - diffMs) / 1000);
      throw new AppError(`Please wait ${remainingSeconds} second(s) before requesting another OTP.`, 429);
    }
  }

  const code = generateNumericOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.query(
    'DELETE FROM otps WHERE email = $1 AND purpose = $2',
    [cleanEmail, purpose]
  );

  await db.query(
    `INSERT INTO otps (email, code, purpose, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [cleanEmail, code, purpose, expiresAt]
  );

  let subject = 'BachatGara Verification Code';
  let html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
      <h2 style="color: #3b82f6;">BachatGara</h2>
      <p>Hello,</p>
      <p>Your one-time verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f3f4f6; text-align: center; border-radius: 8px; margin: 20px 0; color: #111827;">
        ${code}
      </div>
      <p>This code will expire in <strong>5 minutes</strong>.</p>
      <p>If you did not request this verification, please ignore this email.</p>
    </div>
  `;

  if (purpose === 'password_reset') {
    subject = 'BachatGara Password Reset Code';
    html = `
      <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
        <h2 style="color: #3b82f6;">BachatGara Password Reset</h2>
        <p>Hello,</p>
        <p>You requested to reset your password. Use the following code to proceed:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f3f4f6; text-align: center; border-radius: 8px; margin: 20px 0; color: #111827;">
          ${code}
        </div>
        <p>This code will expire in <strong>5 minutes</strong>.</p>
        <p>If you did not make this request, we recommend changing your account credentials immediately.</p>
      </div>
    `;
  }

  await emailService.sendEmail({
    to: cleanEmail,
    subject,
    html,
  });

  return { message: 'OTP sent successfully.' };
};

const verifyOtp = async (email, code, purpose) => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  const result = await db.query(
    `SELECT * FROM otps
     WHERE email = $1 AND code = $2 AND purpose = $3 AND expires_at > NOW()`,
    [cleanEmail, cleanCode, purpose]
  );

  if (result.rows.length === 0) {
    return false;
  }

  await db.query(
    'DELETE FROM otps WHERE email = $1 AND purpose = $2',
    [cleanEmail, purpose]
  );

  return true;
};

const checkOtp = async (email, code, purpose) => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  const result = await db.query(
    `SELECT * FROM otps
     WHERE email = $1 AND code = $2 AND purpose = $3 AND expires_at > NOW()`,
    [cleanEmail, cleanCode, purpose]
  );

  return result.rows.length > 0;
};

module.exports = {
  sendOtp,
  verifyOtp,
  checkOtp,
};

