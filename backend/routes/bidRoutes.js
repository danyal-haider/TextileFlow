const express = require('express');
const router = express.Router();
const { createBid, getMyBids, withdrawBid, getBidsForOrder, acceptBid, rejectBid } = require('../controllers/bidController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBid);
router.get('/my-bids', protect, getMyBids);
router.put('/:id/withdraw', protect, withdrawBid);
router.get('/order/:orderId', protect, getBidsForOrder);

// Exporter Actions
router.put('/:id/accept', protect, acceptBid);
router.put('/:id/reject', protect, rejectBid);

module.exports = router;
