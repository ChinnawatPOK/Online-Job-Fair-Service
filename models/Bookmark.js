const { pool } = require('../config/pgdb');

exports.create = async (userId, companyId, client = pool) => {
    const { rows } = await client.query(
        'INSERT INTO bookmarks (user_id, company_id) VALUES ($1, $2) RETURNING *',
        [userId, companyId]
    );
    return rows[0];
};

exports.findByUser = async (userId, client = pool) => {
    const { rows } = await client.query(
        `SELECT bk.id, bk.company_id, bk.created_at,
                c.name, c.address, c.website, c.description, c.tel
         FROM bookmarks bk
         JOIN companies c ON c.id = bk.company_id
         WHERE bk.user_id = $1
         ORDER BY bk.created_at DESC, bk.id DESC`,
        [userId]
    );
    return rows;
};

exports.remove = async (userId, companyId, client = pool) => {
    const { rowCount } = await client.query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND company_id = $2',
        [userId, companyId]
    );
    return rowCount > 0;
};
