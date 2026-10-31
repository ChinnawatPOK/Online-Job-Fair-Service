const Booking = require('../models/Booking');

// @route   GET /api/v1/bookings
exports.getBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.findAll();
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot find bookings' });
    }
};
