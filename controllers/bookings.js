const Booking = require('../models/Booking');
const Company = require('../models/Company');
const AuditLog = require('../models/AuditLog');
const { withTransaction } = require('../config/pgdb');
const emailService = require('../services/emailService');

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

const snapshot = ({ user_id, company_id, booking_date }) => ({ user_id, company_id, booking_date });

const isAdminActingOnOthers = (user, booking) => user.role === 'admin' && booking.user_id !== user.id;

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

        // Not awaited: the response doesn't wait for the email provider
        emailService.notifyBookingCreated(req.user, booking);

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

        // The booking and its audit log are saved together, or not at all
        const result = await withTransaction(async (client) => {
            const before = await Booking.findByIdForUpdate(id, client);
            if (!before) return null;

            const after = await Booking.update(id, { companyId, bookingDate }, client);
            await AuditLog.create({
                actor: req.user,
                action: 'BOOKING_UPDATED',
                bookingId: after.id,
                details: { before: snapshot(before), after: snapshot(after) }
            }, client);
            return { before, after };
        });
        if (!result) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${id}` });
        }

        // Sent after commit, so a rolled-back change never sends an email
        if (isAdminActingOnOthers(req.user, result.before)) {
            emailService.notifyBookingUpdatedByAdmin(result.before, result.after);
        }

        res.status(200).json({ success: true, data: result.after });
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

        // The delete and its audit log are saved together, or not at all
        const removed = await withTransaction(async (client) => {
            const before = await Booking.findByIdForUpdate(id, client);
            if (!before) return null;

            await Booking.remove(id, client);
            await AuditLog.create({
                actor: req.user,
                action: 'BOOKING_DELETED',
                bookingId: before.id,
                details: { before: snapshot(before) }
            }, client);
            return before;
        });
        if (!removed) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${id}` });
        }

        if (isAdminActingOnOthers(req.user, removed)) {
            emailService.notifyBookingDeletedByAdmin(removed);
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
