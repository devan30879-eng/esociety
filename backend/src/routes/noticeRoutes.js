const express = require('express');
const router = express.Router();
const {
  createNotice, getNotices, getNoticeById, castVote, deleteNotice,
} = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotices);
router.post('/', authorize('admin'), createNotice);
router.get('/:id', getNoticeById);
router.post('/:id/vote', authorize('resident', 'admin'), castVote);
router.delete('/:id', authorize('admin'), deleteNotice);

module.exports = router;
