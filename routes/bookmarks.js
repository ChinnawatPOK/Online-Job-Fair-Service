const express = require('express');
const { addBookmark, getBookmarks, removeBookmark } = require('../controllers/bookmarks');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getBookmarks)
    .post(protect, addBookmark);
router.delete('/:companyId', protect, removeBookmark);

module.exports = router;
