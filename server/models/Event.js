const { pool } = require('../config/db');

const toEvent = (row) => {
    if (!row) return null;
    const event = {
        _id: row.id,
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.date,
        location: row.location,
        category: row.category,
        totalSeats: row.total_seats,
        availableSeats: row.available_seats,
        image: row.image || '',
        ticketPrice: Number(row.ticket_price),
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
    // Populated creator (when joined)
    if (row.creator_name !== undefined && row.created_by) {
        event.createdBy = { _id: row.created_by, name: row.creator_name, email: row.creator_email };
    }
    return event;
};

const SELECT_WITH_CREATOR = `
    SELECT e.*, u.name AS creator_name, u.email AS creator_email
    FROM events e
    LEFT JOIN users u ON u.id = e.created_by`;

const find = async ({ category, search } = {}) => {
    const where = [];
    const params = [];
    if (category) { where.push('e.category = ?'); params.push(category); }
    if (search) { where.push('e.title LIKE ?'); params.push(`%${search}%`); }
    const sql = SELECT_WITH_CREATOR + (where.length ? ` WHERE ${where.join(' AND ')}` : '') + ' ORDER BY e.date ASC';
    const [rows] = await pool.query(sql, params);
    return rows.map(toEvent);
};

const findById = async (id, conn = pool) => {
    const [rows] = await conn.query(`${SELECT_WITH_CREATOR} WHERE e.id = ?`, [id]);
    return toEvent(rows[0]);
};

const create = async (data) => {
    const [result] = await pool.query(
        `INSERT INTO events (title, description, date, location, category, total_seats, available_seats, image, ticket_price, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.title, data.description, new Date(data.date), data.location, data.category,
            data.totalSeats, data.availableSeats ?? data.totalSeats, data.image || '',
            data.ticketPrice || 0, data.createdBy || null,
        ]
    );
    return findById(result.insertId);
};

// camelCase API field -> column name
const UPDATABLE = {
    title: 'title', description: 'description', date: 'date', location: 'location',
    category: 'category', totalSeats: 'total_seats', availableSeats: 'available_seats',
    image: 'image', ticketPrice: 'ticket_price',
};

const update = async (id, data) => {
    const sets = [];
    const params = [];
    for (const [key, column] of Object.entries(UPDATABLE)) {
        if (data[key] !== undefined) {
            sets.push(`${column} = ?`);
            params.push(key === 'date' ? new Date(data[key]) : data[key]);
        }
    }
    if (sets.length) {
        params.push(id);
        await pool.query(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    return findById(id);
};

const remove = async (id) => {
    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

module.exports = { toEvent, find, findById, create, update, remove };
