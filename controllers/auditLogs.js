const AuditLog = require('../models/AuditLog');

const isValidId = (id) => /^[1-9]\d*$/.test(String(id)) && Number(id) <= 2147483647;

// @route   GET /api/v1/admin/audit-logs?bookingId=
exports.getAuditLogs = async (req, res, next) => {
    try {
        const { bookingId } = req.query;

        if (bookingId !== undefined && !isValidId(bookingId)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid bookingId' });
        }

        const logs = await AuditLog.findAll({ bookingId });
        res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot find audit logs' });
    }
};
