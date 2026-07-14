const QcReport = require('../models/QcReport');
const Order = require('../models/Order');
const Machine = require('../models/Machine');
const Production = require('../models/Production');
const { createNotification } = require('./notificationController');

// @desc    Upload a new QC report (Manufacturer)
// @route   POST /api/qc/:orderId/upload
// @access  Private (Assigned Manufacturer only)
const uploadQcReport = async (req, res) => {
    const { orderId } = req.params;
    const { comments, productImages } = req.body;

    if (!comments) {
        return res.status(400).json({ message: 'Please provide inspection summary comments' });
    }

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify manufacturer authority
        if (order.manufacturer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized: You are not the assigned manufacturer' });
        }

        // Create QC report
        const report = await QcReport.create({
            order: orderId,
            manufacturer: req.user.id,
            comments,
            inspectionNotes: '',
            productImages: productImages || [],
            defectImages: [],
            status: 'Pending',
            approvalStatus: 'Pending'
        });

        // Transition Order status to 'under-qc'
        order.status = 'under-qc';
        await order.save();

        // Update production history status
        const production = await Production.findOne({ order: orderId });
        if (production) {
            production.status = 'Production Completed'; // make sure status reflects completion
            production.history.push({
                status: 'Production Completed',
                note: `QC Report submitted. Pending Exporter review.`
            });
            await production.save();
        }

        // Notify Exporter
        await createNotification(
            order.user,
            'QC Report Uploaded',
            `Manufacturer has uploaded a QC Report for your order "${order.title}".`,
            orderId
        );

        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Review a QC report (Exporter)
// @route   PUT /api/qc/:reportId/review
// @access  Private (Exporter/Order Creator only)
const reviewQcReport = async (req, res) => {
    const { reportId } = req.params;
    const { approvalStatus, reviewComments, defectDescription } = req.body;

    if (!approvalStatus || !['Approved', 'Rejected'].includes(approvalStatus)) {
        return res.status(400).json({ message: 'Invalid review status. Must be Approved or Rejected' });
    }

    try {
        const report = await QcReport.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'QC Report not found' });
        }

        const order = await Order.findById(report.order);
        if (!order) {
            return res.status(404).json({ message: 'Order associated with this report not found' });
        }

        // Verify exporter authority
        if (order.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized: You do not own this order' });
        }

        // Update QC report fields
        report.approvalStatus = approvalStatus;
        report.status = approvalStatus === 'Approved' ? 'Passed' : 'Failed';
        report.reviewComments = reviewComments || '';
        report.defectDescription = approvalStatus === 'Rejected' ? defectDescription || '' : '';
        report.reviewedAt = new Date();
        await report.save();

        // Load Production to log status
        const production = await Production.findOne({ order: order._id });

        if (approvalStatus === 'Approved') {
            // Update Order status
            order.status = 'completed';
            await order.save();

            // Release machines to Available
            if (production && production.allocatedMachines && production.allocatedMachines.length > 0) {
                await Machine.updateMany(
                    { _id: { $in: production.allocatedMachines } },
                    { $set: { status: 'Available' } }
                );
            }

            // Log to production history
            if (production) {
                production.history.push({
                    status: 'Production Completed',
                    note: 'QC Approved by exporter. Order is completed and machines released.'
                });
                await production.save();
            }

            // Notify Manufacturer
            await createNotification(
                order.manufacturer,
                'QC Approved & Completed',
                `Exporter approved the QC Report for "${order.title}". Order completed!`,
                order._id
            );
        } else {
            // Rejected / Rework needed
            order.status = 'rework';
            await order.save();

            // Log to production history
            if (production) {
                production.history.push({
                    status: 'Packing', // revert or keep at active production state
                    note: `QC Rejected by exporter. Rework initiated. Defect: ${defectDescription || 'See report details'}`
                });
                await production.save();
            }

            // Notify Manufacturer
            await createNotification(
                order.manufacturer,
                'QC Rejected (Rework Required)',
                `Exporter rejected the QC Report for "${order.title}". Rework required: ${defectDescription || 'check details'}`,
                order._id
            );
        }

        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get latest QC report for an order
// @route   GET /api/qc/:orderId/latest
// @access  Private (Exporter or assigned Manufacturer only)
const getLatestQcReport = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Authorize: Exporter or Assigned Manufacturer only
        const isExporter = order.user.toString() === req.user.id;
        const isManufacturer = order.manufacturer && order.manufacturer.toString() === req.user.id;

        if (!isExporter && !isManufacturer) {
            return res.status(403).json({ message: 'Not authorized to view QC report' });
        }

        const report = await QcReport.findOne({ order: orderId })
            .sort({ createdAt: -1 })
            .populate('manufacturer', 'name email companyName');

        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadQcReport,
    reviewQcReport,
    getLatestQcReport
};
