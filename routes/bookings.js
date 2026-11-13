const express = require('express');
const { getBookings } = require('../controllers/bookings');
const { createBooking, getMyBookings, updateBooking, deleteBooking, getBookingStats } = require('../controllers/bookings');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin'), getBookings);
router.post('/', protect, authorize('user'), createBooking);
router.get('/me', protect, authorize('user'), getMyBookings);
router.get('/stats', protect, authorize('admin'), getBookingStats);
router.patch('/:id', protect, authorize('user', 'admin'), updateBooking);
router.delete('/:id', protect, authorize('user', 'admin'), deleteBooking);

module.exports = router;
