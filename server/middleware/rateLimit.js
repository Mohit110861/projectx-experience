const rateLimit = require('express-rate-limit');

const tooMany = (message) => ({
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
});

// Login / registration: slows down password guessing.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    ...tooMany('Too many login attempts. Please try again in 15 minutes.'),
});

// OTP send / verify: a 6-digit code must not be brute-forceable.
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    ...tooMany('Too many OTP attempts. Please wait 10 minutes and request a new code.'),
});

module.exports = { authLimiter, otpLimiter };
