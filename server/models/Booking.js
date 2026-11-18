const { pool } = require('../config/db');

// Bookings are returned with userId / eventId "populated" as objects,
// matching the shape the React frontend already uses.
const SELECT_POPULATED = `
    SELECT b.*,
           u.name AS u_name, u.email AS u_email, u.phone AS u_phone, u.is_blocked AS u_blocked,
           e.id AS e_id, e.title AS e_title, e.description AS e_description, e.date AS e_date,
           e.location AS e_location, e.category AS e_category, e.total_seats AS e_total_seats,
           e.available_seats AS e_available_seats, e.image AS e_image, e.ticket_price AS e_ticket_price,
           e.created_by AS e_created_by
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    LEFT JOIN events e ON e.id = b.event_id`;

const toBooking = (row) => {
    if (!row) return null;
    return {
        _id: row.id,
        id: row.id,
        userId: row.u_name !== undefined
            ? { _id: row.user_id, name: row.u_name, email: row.u_email, phone: row.u_phone || '', isBlocked: !!row.u_blocked }
            : row.user_id,
        eventId: row.e_id
            ? {
                _id: row.e_id,
                title: row.e_title,
                description: row.e_description,
                date: row.e_date,
                location: row.e_location,
                category: row.e_category,
                totalSeats: row.e_total_seats,
                availableSeats: row.e_available_seats,
                image: row.e_image || '',
                ticketPrice: Number(row.e_ticket_price),
                createdBy: row.e_created_by,
            }
            : (row.u_name !== undefined ? null : row.event_id),
        status: row.status,
        paymentStatus: row.payment_status,
        paymentMethod: row.payment_method || '',
        paymentRef: row.payment_ref || '',
        paidAt: row.paid_at || null,
        amount: Number(row.amount),
        bookedAt: row.booked_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

const findById = async (id, conn = pool) => {
    const [rows] = await conn.query(`${SELECT_POPULATED} WHERE b.id = ?`, [id]);
    return toBooking(rows[0]);
};

const findAll = async () => {
    const [rows] = await pool.query(`${SELECT_POPULATED} ORDER BY b.created_at DESC, b.id DESC`);
    return rows.map(toBooking);
};

const findByUser = async (userId) => {
    const [rows] = await pool.query(`${SELECT_POPULATED} WHERE b.user_id = ? ORDER BY b.created_at DESC, b.id DESC`, [userId]);
    return rows.map(toBooking);
};

// Latest booking of a user for an event (any status)
const findLatestForUserEvent = async (userId, eventId) => {
    const [rows] = await pool.query(
        'SELECT * FROM bookings WHERE user_id = ? AND event_id = ? ORDER BY id DESC LIMIT 1',
        [userId, eventId]
    );
    return toBooking(rows[0]);
};

const hasActiveBooking = async (userId, eventId) => {
    const [rows] = await pool.query(
        "SELECT id FROM bookings WHERE user_id = ? AND event_id = ? AND status <> 'cancelled' LIMIT 1",
        [userId, eventId]
    );
    return rows.length > 0;
};

const create = async ({ userId, eventId, status = 'pending', paymentStatus = 'not_paid', amount }) => {
    const [result] = await pool.query(
        'INSERT INTO bookings (user_id, event_id, status, payment_status, amount) VALUES (?, ?, ?, ?, ?)',
        [userId, eventId, status, paymentStatus, amount]
    );
    return findById(result.insertId);
};

module.exports = { toBooking, findById, findAll, findByUser, findLatestForUserEvent, hasActiveBooking, create };
