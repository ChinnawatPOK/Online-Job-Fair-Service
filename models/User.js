const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/pgdb');

const PUBLIC_COLUMNS = 'id, name, tel, email, role, created_at';

exports.create = async ({ name, tel, email, password, role = 'user' }, client = pool) => {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const { rows } = await client.query(
        `INSERT INTO users (name, tel, email, password, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${PUBLIC_COLUMNS}`,
        [name, tel, email, hashed, role]
    );
    return rows[0];
};

exports.findByEmail = async (email, { withPassword = false } = {}, client = pool) => {
    const columns = withPassword ? `${PUBLIC_COLUMNS}, password` : PUBLIC_COLUMNS;
    const { rows } = await client.query(`SELECT ${columns} FROM users WHERE email = $1`, [email]);
    return rows[0];
};

exports.findById = async (id, client = pool) => {
    const { rows } = await client.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0];
};

exports.matchPassword = (enteredPassword, hashedPassword) => {
    return bcrypt.compare(enteredPassword, hashedPassword);
};

exports.getSignedJwtToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};
