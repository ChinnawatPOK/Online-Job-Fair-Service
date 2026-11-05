const express = require('express');
const { getBookings } = require('../controllers/bookings');
const { createBooking } = require('../controllers/bookings');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin'), getBookings);
router.post('/', protect, authorize('user'), createBooking);

module.exports = router;
