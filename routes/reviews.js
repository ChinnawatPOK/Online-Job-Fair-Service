const express = require('express');
const { createReview, getReviews } = require('../controllers/reviews');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getReviews)
    .post(protect, createReview);

module.exports = router;
