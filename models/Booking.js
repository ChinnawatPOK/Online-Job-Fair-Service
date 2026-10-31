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
