const express = require('express');
const router = express.Router();
const { allocateMachines, updateProductionStatus, getProductionDetail } = require('../controllers/productionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:orderId')
    .get(protect, getProductionDetail);

router.route('/:orderId/allocate')
    .post(protect, allocateMachines);

router.route('/:orderId/status')
    .put(protect, updateProductionStatus);

module.exports = router;
