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
