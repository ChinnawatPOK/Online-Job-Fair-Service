const Booking = require('../models/Booking');
const Company = require('../models/Company');

const MAX_BOOKINGS_PER_USER = 3;
const BOOKING_DATE_START = '2022-05-10';
const BOOKING_DATE_END = '2022-05-13';

const isValidId = (id) =>
    (typeof id === 'number' || typeof id === 'string') &&
    /^[1-9]\d*$/.test(String(id)) &&
    Number(id) <= 2147483647;

// YYYY-MM-DD strings sort chronologically, so they can be compared directly
const isValidBookingDate = (date) =>
    typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    date >= BOOKING_DATE_START &&
    date <= BOOKING_DATE_END;

// @route   POST /api/v1/bookings
exports.createBooking = async (req, res, next) => {
    try {
        const { companyId, bookingDate } = req.body || {};

        if (!isValidId(companyId)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid companyId' });
        }
        if (!isValidBookingDate(bookingDate)) {
            return res.status(400).json({
                success: false,
                message: `bookingDate must be in YYYY-MM-DD format, from ${BOOKING_DATE_START} to ${BOOKING_DATE_END}`
            });
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: `No company with the id of ${companyId}` });
        }

        const booking = await Booking.createWithinLimit(req.user.id, company.id, bookingDate, MAX_BOOKINGS_PER_USER);
        if (!booking) {
            return res.status(409).json({
                success: false,
                message: `You have reached the limit of ${MAX_BOOKINGS_PER_USER} bookings`
            });
        }

        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot create booking' });
    }
};

// @route   PATCH /api/v1/bookings/:id
exports.updateBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { companyId, bookingDate } = req.body || {};

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid booking id' });
        }
        if (companyId === undefined && bookingDate === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide companyId or bookingDate' });
        }
        if (companyId !== undefined && !isValidId(companyId)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid companyId' });
        }
        if (bookingDate !== undefined && !isValidBookingDate(bookingDate)) {
            return res.status(400).json({
                success: false,
                message: `bookingDate must be in YYYY-MM-DD format, from ${BOOKING_DATE_START} to ${BOOKING_DATE_END}`
            });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${id}` });
        }
        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
        }

        if (companyId !== undefined) {
            const company = await Company.findById(companyId);
            if (!company) {
                return res.status(404).json({ success: false, message: `No company with the id of ${companyId}` });
            }
        }

        const updated = await Booking.update(id, { companyId, bookingDate });
        if (!updated) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${id}` });
        }

        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot update booking' });
    }
};

// @route   DELETE /api/v1/bookings/:id
exports.deleteBooking = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid booking id' });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${id}` });
        }
        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
        }

        const removed = await Booking.remove(id);
        if (!removed) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${id}` });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot delete booking' });
    }
};

// @route   GET /api/v1/bookings/me
exports.getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.findByUser(req.user.id);
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot find bookings' });
    }
};

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
