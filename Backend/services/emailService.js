const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
  console.log('Nodemailer SMTP Transporter initialized successfully.');
} else {
  console.warn('WARNING: SMTP configuration is missing. Nodemailer will fall back to logging emails to the console.');
}

/**
 * Sends an email
 * @param {string} to recipient email
 * @param {string} subject email subject
 * @param {string} html email body in HTML format
 * @param {string} text email body in plain text format
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_USER,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Fallback simple text parser
      });
      console.log(`Email successfully sent to ${to}.`);
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err);
      throw err;
    }
  } else {
    // Development fallback console log
    console.log('\n==================================================');
    console.log(`[SIMULATED EMAIL SENT]`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || html.replace(/<[^>]*>/g, '')}`);
    console.log('==================================================\n');
  }
};

module.exports = {
  sendEmail,
};
