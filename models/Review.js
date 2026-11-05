const { pool } = require('../config/pgdb');

exports.create = async ({ userId, companyId, rating, comment }, client = pool) => {
    const { rows } = await client.query(
        `INSERT INTO reviews (user_id, company_id, rating, comment)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, companyId, rating, comment]
    );
    return rows[0];
};

exports.findByCompany = async (companyId, client = pool) => {
    const { rows } = await client.query(
        `SELECT r.id, r.company_id, r.rating, r.comment, r.created_at,
                u.name AS reviewer_name
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.company_id = $1
         ORDER BY r.created_at DESC, r.id DESC`,
        [companyId]
    );
    return rows;
};

// average_rating is null when the company has no reviews yet
exports.getAverageRating = async (companyId, client = pool) => {
    const { rows } = await client.query(
        'SELECT ROUND(AVG(rating), 2)::float8 AS average_rating FROM reviews WHERE company_id = $1',
        [companyId]
    );
    return rows[0].average_rating;
};
