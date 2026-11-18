const { pool } = require('../config/db');

// Maps a DB row to the same shape the frontend expects (Mongo-style `_id`)
const toUser = (row, { withPassword = false } = {}) => {
    if (!row) return null;
    const user = {
        _id: row.id,
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        isVerified: !!row.is_verified,
        isBlocked: !!row.is_blocked,
        phone: row.phone || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
    if (withPassword) user.password = row.password;
    return user;
};

const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return toUser(rows[0]);
};

const findByEmail = async (email, opts = { withPassword: true }) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return toUser(rows[0], opts);
};

const create = async ({ name, email, password, role = 'user', isVerified = false }) => {
    const [result] = await pool.query(
        'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)',
        [name, email, password, role, isVerified]
    );
    return findById(result.insertId);
};

const setVerified = async (email) => {
    await pool.query('UPDATE users SET is_verified = TRUE WHERE email = ?', [email]);
    return findByEmail(email, { withPassword: false });
};

module.exports = { toUser, findById, findByEmail, create, setVerified };
