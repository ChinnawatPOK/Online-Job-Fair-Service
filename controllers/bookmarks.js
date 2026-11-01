const Bookmark = require('../models/Bookmark');
const Company = require('../models/Company');

// Postgres integer ids: reject anything else so the query never sees a bad cast
const isValidId = (id) => /^\d+$/.test(String(id)) && Number(id) <= 2147483647;

// @route   POST /api/v1/users/me/bookmarks
exports.addBookmark = async (req, res, next) => {
    try {
        const { companyId } = req.body;

        if (!isValidId(companyId)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid companyId' });
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: `No company with the id of ${companyId}` });
        }

        const bookmark = await Bookmark.create(req.user.id, company.id);
        res.status(201).json({ success: true, data: bookmark });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'This company is already bookmarked' });
        }
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot add bookmark' });
    }
};

// @route   GET /api/v1/users/me/bookmarks
exports.getBookmarks = async (req, res, next) => {
    try {
        const bookmarks = await Bookmark.findByUser(req.user.id);
        res.status(200).json({ success: true, count: bookmarks.length, data: bookmarks });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot find bookmarks' });
    }
};

// @route   DELETE /api/v1/users/me/bookmarks/:companyId
exports.removeBookmark = async (req, res, next) => {
    try {
        const { companyId } = req.params;

        const removed = isValidId(companyId) ? await Bookmark.remove(req.user.id, companyId) : false;
        if (!removed) {
            return res.status(404).json({ success: false, message: `No bookmark for company ${companyId}` });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot remove bookmark' });
    }
};
