const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Company = require('../models/Company');

const isValidId = (id) => /^\d+$/.test(String(id)) && Number(id) <= 2147483647;

// @route   POST /api/v1/companies/:companyId/reviews
exports.createReview = async (req, res, next) => {
    try {
        const { companyId } = req.params;
        const { rating, comment } = req.body || {};

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'rating must be an integer from 1 to 5' });
        }
        if (typeof comment !== 'string' || !comment.trim()) {
            return res.status(400).json({ success: false, message: 'Please provide a comment' });
        }

        const company = isValidId(companyId) ? await Company.findById(companyId) : null;
        if (!company) {
            return res.status(404).json({ success: false, message: `No company with the id of ${companyId}` });
        }

        const hasBooked = await Booking.existsForUserAndCompany(req.user.id, company.id);
        if (!hasBooked) {
            return res.status(403).json({ success: false, message: 'You can only review a company you have booked' });
        }

        const review = await Review.create({
            userId: req.user.id,
            companyId: company.id,
            rating,
            comment: comment.trim()
        });
        res.status(201).json({ success: true, data: review });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'You have already reviewed this company' });
        }
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot create review' });
    }
};

// @route   GET /api/v1/companies/:companyId/reviews
exports.getReviews = async (req, res, next) => {
    try {
        const { companyId } = req.params;

        const company = isValidId(companyId) ? await Company.findById(companyId) : null;
        if (!company) {
            return res.status(404).json({ success: false, message: `No company with the id of ${companyId}` });
        }

        const reviews = await Review.findByCompany(company.id);
        const averageRating = await Review.getAverageRating(company.id);

        res.status(200).json({
            success: true,
            count: reviews.length,
            average_rating: averageRating,
            data: reviews
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot find reviews' });
    }
};
