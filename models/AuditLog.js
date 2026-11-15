const { pool } = require('../config/pgdb');

exports.create = async ({ actor, action, bookingId, details }, client = pool) => {
    await client.query(
        `INSERT INTO audit_logs (actor_id, actor_role, action, booking_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [actor.id, actor.role, action, bookingId, details]
    );
};

// filter: { bookingId? }
exports.findAll = async ({ bookingId } = {}, client = pool) => {
    const params = [];
    let where = '';

    if (bookingId) {
        params.push(bookingId);
        where = 'WHERE a.booking_id = $1';
    }

    const { rows } = await client.query(
        `SELECT a.id, a.actor_id, u.name AS actor_name, u.email AS actor_email, a.actor_role,
                a.action, a.booking_id, a.details, a.created_at
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.actor_id
         ${where}
         ORDER BY a.id DESC`,
        params
    );
    return rows;
};
