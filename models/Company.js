const { pool } = require('../config/pgdb');

exports.findAll = async (client = pool) => {
    const { rows } = await client.query('SELECT * FROM companies ORDER BY id');
    return rows;
};

exports.findById = async (id, client = pool) => {
    const { rows } = await client.query('SELECT * FROM companies WHERE id = $1', [id]);
    return rows[0];
};

// Used by the seed script
exports.create = async ({ name, address, website, description, tel }, client = pool) => {
    const { rows } = await client.query(
        `INSERT INTO companies (name, address, website, description, tel)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, address, website, description, tel]
    );
    return rows[0];
};
