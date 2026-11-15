const express = require('express');
const { getCompanies } = require('../controllers/companies');
const reviewRouter = require('./reviews');

const router = express.Router();

router.use('/:companyId/reviews', reviewRouter);

router.get('/', getCompanies);

module.exports = router;
