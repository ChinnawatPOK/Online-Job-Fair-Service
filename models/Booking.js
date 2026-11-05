const { pool } = require('../config/pgdb');

exports.findAll = async (client = pool) => {
    const { rows } = await client.query(
        `SELECT b.id, b.user_id, b.company_id, b.booking_date, b.created_at,
                c.name AS company_name, c.address AS company_address,
                c.website AS company_website, c.tel AS company_tel
         FROM bookings b
         JOIN companies c ON c.id = b.company_id
         ORDER BY b.booking_date, b.id`
    );
    return rows;
};

exports.findByUser = async (userId, client = pool) => {
    const { rows } = await client.query(
        `SELECT b.id, b.user_id, b.company_id, b.booking_date, b.created_at,
                c.name AS company_name, c.address AS company_address,
                c.website AS company_website, c.tel AS company_tel
         FROM bookings b
         JOIN companies c ON c.id = b.company_id
         WHERE b.user_id = $1
         ORDER BY b.booking_date, b.id`,
        [userId]
    );
    return rows;
};

exports.findById = async (id, client = pool) => {
    const { rows } = await client.query('SELECT * FROM bookings WHERE id = $1', [id]);
    return rows[0];
};

// Fields left undefined keep their current value
exports.update = async (id, { companyId, bookingDate }, client = pool) => {
    const { rows } = await client.query(
        `UPDATE bookings
         SET company_id = COALESCE($2, company_id),
             booking_date = COALESCE($3, booking_date)
         WHERE id = $1
         RETURNING *`,
        [id, companyId, bookingDate]
    );
    return rows[0];
};

exports.remove = async (id, client = pool) => {
    const { rowCount } = await client.query('DELETE FROM bookings WHERE id = $1', [id]);
    return rowCount > 0;
};

// Returns the new booking, or null when the user has already reached the limit.
// The user row stays locked until commit, so concurrent requests from the same
// user run one at a time and cannot pass the limit.
exports.createWithinLimit = async (userId, companyId, bookingDate, limit) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);

        const { rows: [{ count }] } = await client.query(
            'SELECT COUNT(*)::int AS count FROM bookings WHERE user_id = $1',
            [userId]
        );

        if (count >= limit) {
            await client.query('ROLLBACK');
            return null;
        }

        const { rows } = await client.query(
            `INSERT INTO bookings (user_id, company_id, booking_date)
             VALUES ($1, $2, $3) RETURNING *`,
            [userId, companyId, bookingDate]
        );

        await client.query('COMMIT');
        return rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
