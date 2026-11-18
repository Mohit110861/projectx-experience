const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { runMigrations } = require('./migrations');
const { insertDefaultContent } = require('./defaultContent');

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'eventora';

const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
};

const pool = mysql.createPool({
    ...baseConfig,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: false,
    timezone: 'Z',
});

// Every connection works in UTC so CURRENT_TIMESTAMP/NOW() match the dates the app writes
pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));

// Creates the database (if missing) and all tables from schema.sql
const initDB = async () => {
    const conn = await mysql.createConnection({ ...baseConfig, multipleStatements: true });
    await conn.query("SET time_zone = '+00:00'");
    try {
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await conn.query(`USE \`${DB_NAME}\``);
        const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8')
            .replace(/^CREATE DATABASE[^;]*;/im, '')
            .replace(/^USE [^;]*;/im, '');
        await conn.query(schema);
        await runMigrations(conn, DB_NAME);
        await insertDefaultContent(conn);
    } finally {
        await conn.end();
    }
};

module.exports = { pool, initDB };
