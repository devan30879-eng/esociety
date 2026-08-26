const Notice = require('../models/Notice');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route  POST /api/notices
 * @desc   Admin posts a notice/event/poll
 * @access Private/Admin
 */
const createNotice = asyncHandler(async (req, res) => {
  const {
    title, content, type, priority, targetRole,
    eventDate, eventVenue, pollOptions, expiresAt,
  } = req.body;

  // Build poll options array if type is 'poll'
  const options = type === 'poll' && pollOptions
    ? pollOptions.map((opt) => ({ option: opt, votes: [] }))
    : [];

  const notice = await Notice.create({
    title,
    content,
    type,
    priority,
    targetRole: targetRole || 'all',
    eventDate,
    eventVenue,
    pollOptions: options,
    expiresAt,
    postedBy: req.user._id,
  });

  // Broadcast new notice to all connected users via Socket.IO
  if (req.io) {
    req.io.emit('new_notice', {
      message: `New ${type}: ${title}`,
      noticeId: notice._id,
      type,
    });
  }

  res.status(201).json({ success: true, message: 'Notice posted', notice });
});

/**
 * @route  GET /api/notices
 * @desc   Get all active notices for the user's role
 * @access Private
 */
const getNotices = asyncHandler(async (req, res) => {
  const { type, limit = 20 } = req.query;

  // Filter notices visible to the user's role
  const filter = {
    isActive: true,
    $or: [{ targetRole: 'all' }, { targetRole: req.user.role }],
  };

  if (type) filter.type = type;

  const notices = await Notice.find(filter)
    .populate('postedBy', 'name role')
    .sort({ priority: -1, createdAt: -1 })
    .limit(parseInt(limit));

  res.json({ success: true, count: notices.length, notices });
});

/**
 * @route  GET /api/notices/:id
 * @desc   Get a single notice and mark it as read
 * @access Private
 */
const getNoticeById = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id)
    .populate('postedBy', 'name')
    .populate('pollOptions.votes', 'name')
    .populate('readBy.user', 'name');

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found' });
  }

  // Mark as read if not already read by this user
  const alreadyRead = notice.readBy.some(
    (r) => r.user && r.user._id.toString() === req.user._id.toString()
  );

  if (!alreadyRead) {
    notice.readBy.push({ user: req.user._id });
    await notice.save();
  }

  res.json({ success: true, notice });
});

/**
 * @route  POST /api/notices/:id/vote
 * @desc   Cast a vote on a poll option
 * @access Private/Resident
 */
const castVote = asyncHandler(async (req, res) => {
  const { optionIndex } = req.body;

  const notice = await Notice.findById(req.params.id);

  if (!notice || notice.type !== 'poll') {
    return res.status(404).json({ success: false, message: 'Poll not found' });
  }

  // Check if user already voted in any option
  const alreadyVoted = notice.pollOptions.some((opt) =>
    opt.votes.map((v) => v.toString()).includes(req.user._id.toString())
  );

  if (alreadyVoted) {
    return res.status(400).json({ success: false, message: 'You have already voted' });
  }

  if (optionIndex < 0 || optionIndex >= notice.pollOptions.length) {
    return res.status(400).json({ success: false, message: 'Invalid option' });
  }

  // Add user's vote to the selected option
  notice.pollOptions[optionIndex].votes.push(req.user._id);
  await notice.save();

  res.json({ success: true, message: 'Vote cast successfully', notice });
});

/**
 * @route  DELETE /api/notices/:id
 * @desc   Deactivate/delete a notice
 * @access Private/Admin
 */
const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found' });
  }

  res.json({ success: true, message: 'Notice removed' });
});

module.exports = { createNotice, getNotices, getNoticeById, castVote, deleteNotice };
