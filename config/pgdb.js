const { Pool, types } = require('pg');

types.setTypeParser(1082, (value) => value);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const tables = [
    `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tel VARCHAR(20) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        website VARCHAR(255),
        description TEXT,
        tel VARCHAR(20),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL CHECK (booking_date BETWEEN '2022-05-10' AND '2022-05-13'),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, company_id)
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, company_id)
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        actor_id INT REFERENCES users(id) ON DELETE SET NULL,
        actor_role VARCHAR(10) NOT NULL,
        action VARCHAR(50) NOT NULL,
        booking_id INT,
        details JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`
];

async function initTables() {
    for (const query of tables) {
        await pool.query(query);
    }
    console.log('Tables ready');
}

module.exports = { pool, initTables };
