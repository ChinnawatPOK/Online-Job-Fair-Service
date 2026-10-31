const express = require('express');
const { getBookings } = require('../controllers/bookings');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin'), getBookings);

module.exports = router;
