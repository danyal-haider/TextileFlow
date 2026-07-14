const express = require('express');
const router = express.Router();
const { getOrders, createOrder, deleteOrder, updateOrder, getOrderById } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getOrders).post(protect, createOrder);
router.route('/:id').get(protect, getOrderById).delete(protect, deleteOrder).put(protect, updateOrder);

module.exports = router;
