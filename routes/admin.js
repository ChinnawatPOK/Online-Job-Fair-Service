const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogs');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/audit-logs', protect, authorize('admin'), getAuditLogs);

module.exports = router;
