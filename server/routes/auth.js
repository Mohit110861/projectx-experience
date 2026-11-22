const express = require('express');
const router = express.Router();
const { register, login, verifyOTP } = require('../controllers/authController');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOTP);

module.exports = router;
