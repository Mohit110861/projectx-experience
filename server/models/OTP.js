const { pool } = require('../config/db');

const EXPIRY_MINUTES = 5;

// Replaces any previous OTP for this email/action with a new one
const replace = async (email, otp, action) => {
    await pool.query('DELETE FROM otps WHERE email = ? AND action = ?', [email, action]);
    await pool.query('INSERT INTO otps (email, otp, action) VALUES (?, ?, ?)', [email, otp, action]);
};

// Returns the OTP row if it matches and hasn't expired
const findValid = async (email, otp, action) => {
    const [rows] = await pool.query(
        `SELECT * FROM otps
         WHERE email = ? AND otp = ? AND action = ?
           AND created_at >= (NOW() - INTERVAL ${EXPIRY_MINUTES} MINUTE)
         LIMIT 1`,
        [email, String(otp ?? ''), action]
    );
    return rows[0] || null;
};

const deleteById = async (id) => {
    await pool.query('DELETE FROM otps WHERE id = ?', [id]);
};

const cleanupExpired = async () => {
    await pool.query(`DELETE FROM otps WHERE created_at < (NOW() - INTERVAL ${EXPIRY_MINUTES} MINUTE)`);
};

module.exports = { replace, findValid, deleteById, cleanupExpired };
