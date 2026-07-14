const Production = require('../models/Production');
const Order = require('../models/Order');
const Machine = require('../models/Machine');
const { createNotification } = require('./notificationController');

// @desc    Allocate machines to a won order
// @route   POST /api/production/:orderId/allocate
// @access  Private (Manufacturer only)
const allocateMachines = async (req, res) => {
    const { orderId } = req.params;
    const { machineIds, estStartDate, estEndDate } = req.body;

    if (!machineIds || !Array.isArray(machineIds) || machineIds.length === 0) {
        return res.status(400).json({ message: 'Please select at least one machine for allocation' });
    }

    if (!estStartDate || !estEndDate) {
        return res.status(400).json({ message: 'Please provide estimated start and completion dates' });
    }

    try {
        const production = await Production.findOne({ order: orderId });
        if (!production) {
            return res.status(404).json({ message: 'Production record not found for this order' });
        }

        // Check if current user is the assigned manufacturer
        if (production.manufacturer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized: You are not the assigned manufacturer' });
        }

        // Verify all requested machines belong to the manufacturer and are Available
        const machines = await Machine.find({ _id: { $in: machineIds } });
        if (machines.length !== machineIds.length) {
            return res.status(400).json({ message: 'One or more selected machines were not found' });
        }

        for (const machine of machines) {
            if (machine.user.toString() !== req.user.id) {
                return res.status(401).json({ message: `Not authorized to allocate machine: ${machine.name}` });
            }
            if (machine.status !== 'Available') {
                return res.status(400).json({ message: `Machine ${machine.name} is currently ${machine.status} and cannot be allocated` });
            }
        }

        // Set allocated machines status to Busy
        await Machine.updateMany(
            { _id: { $in: machineIds } },
            { $set: { status: 'Busy' } }
        );

        // Update production details
        production.allocatedMachines = machineIds;
        production.estStartDate = new Date(estStartDate);
        production.estEndDate = new Date(estEndDate);
        production.status = 'Production Started';
        
        // Push initial history log
        production.history.push({
            status: 'Production Started',
            note: `Allocated ${machineIds.length} machine(s). Est. Start: ${new Date(estStartDate).toLocaleDateString()}, Est. Completion: ${new Date(estEndDate).toLocaleDateString()}`
        });

        await production.save();

        const populatedProduction = await Production.findById(production._id)
            .populate('allocatedMachines')
            .populate('manufacturer', 'name email companyName');

        const orderObj = await Order.findById(production.order);
        if (orderObj) {
            await createNotification(
                orderObj.user,
                'Machines Allocated & Production Started',
                `Manufacturer has allocated ${machineIds.length} machine(s) and set timelines for your order. Production has started!`,
                production.order
            );
        }

        res.status(200).json(populatedProduction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update production status manually
// @route   PUT /api/production/:orderId/status
// @access  Private (Manufacturer only)
const updateProductionStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const validStatuses = [
        'Waiting for Machine Allocation',
        'Production Started',
        'Cutting',
        'Stitching',
        'Finishing',
        'Packing',
        'Production Completed'
    ];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid or missing production status' });
    }

    try {
        const production = await Production.findOne({ order: orderId });
        if (!production) {
            return res.status(404).json({ message: 'Production record not found' });
        }

        // Check ownership
        if (production.manufacturer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Update status and history
        production.status = status;
        production.history.push({
            status,
            note: note || '',
            timestamp: new Date()
        });

        // Special actions if completed
        const order = await Order.findById(orderId);
        if (order) {
            if (status === 'Production Completed') {
                order.status = 'under-qc';
                await order.save();
            }

            // Notify Exporter of status change
            await createNotification(
                order.user,
                `Production Update: ${status}`,
                `The production stage for your order "${order.title}" has been updated to "${status}". Note: ${note || 'No notes added.'}`,
                orderId
            );
        }

        await production.save();
        res.status(200).json(production);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get production tracking details for an order
// @route   GET /api/production/:orderId
// @access  Private (Manufacturer or Exporter of the order)
const getProductionDetail = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Authorize: User must be either the exporter who created the order or the assigned manufacturer
        const isExporter = order.user.toString() === req.user.id;
        const isManufacturer = order.manufacturer && order.manufacturer.toString() === req.user.id;

        if (!isExporter && !isManufacturer) {
            return res.status(403).json({ message: 'Access denied: You are not authorized to track this order' });
        }

        const production = await Production.findOne({ order: orderId })
            .populate('allocatedMachines')
            .populate('manufacturer', 'name email companyName');
            
        if (!production) {
            return res.status(404).json({ message: 'Production tracking has not started yet' });
        }

        res.status(200).json(production);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    allocateMachines,
    updateProductionStatus,
    getProductionDetail
};
