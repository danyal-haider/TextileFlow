const express = require('express');
const router = express.Router();
const { getMachines, createMachine, updateMachine, deleteMachine } = require('../controllers/machineController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getMachines)
    .post(protect, createMachine);

router.route('/:id')
    .put(protect, updateMachine)
    .delete(protect, deleteMachine);

module.exports = router;
