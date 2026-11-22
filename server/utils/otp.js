const crypto = require('crypto');

// 6-digit one-time code from a cryptographically secure source.
// (Math.random() is predictable and must not be used for security codes.)
const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

module.exports = { generateOTP };
