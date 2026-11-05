const express = require('express');
const { getBookings } = require('../controllers/bookings');
const { createBooking, getMyBookings } = require('../controllers/bookings');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin'), getBookings);
router.post('/', protect, authorize('user'), createBooking);
router.get('/me', protect, authorize('user'), getMyBookings);

module.exports = router;
