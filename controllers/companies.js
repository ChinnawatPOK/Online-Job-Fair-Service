const Company = require('../models/Company');

// @route   GET /api/v1/companies
exports.getCompanies = async (req, res, next) => {
    try {
        const companies = await Company.findAll();
        res.status(200).json({ success: true, count: companies.length, data: companies });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot find companies' });
    }
};
