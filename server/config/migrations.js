// Adds columns that older databases are missing (CREATE TABLE IF NOT EXISTS doesn't add them)
const COLUMNS = [
    ['users', 'is_blocked', 'BOOLEAN NOT NULL DEFAULT FALSE'],
    ['users', 'phone', "VARCHAR(30) DEFAULT ''"],
    ['bookings', 'payment_method', "VARCHAR(30) DEFAULT ''"],
    ['bookings', 'payment_ref', "VARCHAR(120) DEFAULT ''"],
    ['bookings', 'paid_at', 'DATETIME NULL'],
];

const runMigrations = async (conn, dbName) => {
    for (const [table, column, definition] of COLUMNS) {
        const [rows] = await conn.query(
            'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [dbName, table, column]
        );
        if (!rows.length) await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
};

module.exports = { runMigrations };
