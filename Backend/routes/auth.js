const router = require('express').Router();
const ctrl = require('../controllers/authController');
const validate = require('../middleware/validate');
const v = require('../validators/authValidators');

router.post('/register', validate(v.register), ctrl.register);
router.post('/login',    validate(v.login),    ctrl.login);
router.post('/verify-email', validate(v.verifyEmail), ctrl.verifyEmail);
router.post('/resend-otp', validate(v.resendOtp), ctrl.resendOtp);
router.post('/forgot-password', validate(v.forgotPassword), ctrl.forgotPassword);
router.post('/verify-reset-otp', validate(v.verifyEmail), ctrl.verifyResetOtpOnly);
router.post('/reset-password', validate(v.resetPassword), ctrl.resetPassword);

module.exports = router;
