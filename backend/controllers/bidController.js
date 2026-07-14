const Bid = require('../models/Bid');
const Order = require('../models/Order');
const Production = require('../models/Production');
const { createNotification } = require('./notificationController');

// @desc    Place a bid on an order
// @route   POST /api/bids
// @access  Private (Manufacturer only)
const createBid = async (req, res) => {
    const { orderId, pricePerUnit, deadline, proposal } = req.body;

    if (!orderId || !pricePerUnit || !deadline) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if bid already exists for this user and order
        const existingBid = await Bid.findOne({ order: orderId, manufacturer: req.user.id });
        if (existingBid) {
            return res.status(400).json({ message: 'You have already placed a bid on this order' });
        }

        const totalPrice = Number(pricePerUnit) * Number(order.quantity);

        const bid = await Bid.create({
            order: orderId,
            manufacturer: req.user.id,
            pricePerUnit: Number(pricePerUnit),
            price: totalPrice,
            deadline: new Date(deadline),
            proposal,
            status: 'pending'
        });

        // Update order status to 'bidding' if it was 'pending'
        if (order.status === 'pending') {
            order.status = 'bidding';
            await order.save();
        }

        // Notify Exporter
        await createNotification(
            order.user,
            'New Bid Submitted',
            `A manufacturer has placed a bid of PKR ${pricePerUnit}/unit on your order "${order.title}".`,
            order._id
        );

        res.status(201).json(bid);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get bids placed by the current manufacturer
// @route   GET /api/bids/my-bids
// @access  Private
const getMyBids = async (req, res) => {
    try {
        const bids = await Bid.find({ manufacturer: req.user.id })
            .populate('order', 'title quantity description deadline status')
            .sort({ createdAt: -1 });
        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Withdraw a bid
// @route   PUT /api/bids/:id/withdraw
// @access  Private
const withdrawBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Ensure user owns the bid
        if (bid.manufacturer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (bid.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot withdraw a bid that is not pending' });
        }

        bid.status = 'withdrawn';
        await bid.save();

        res.status(200).json(bid);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all bids for a specific order (For Exporter)
// @route   GET /api/bids/order/:orderId
// @access  Private
const getBidsForOrder = async (req, res) => {
    try {
        const bids = await Bid.find({ order: req.params.orderId })
            .populate('manufacturer', 'name email')
            .sort({ price: 1 }); // Lowest price first
        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept a bid (Exporter)
// @route   PUT /api/bids/:id/accept
// @access  Private
const acceptBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        const order = await Order.findById(bid.order);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify Exporter Ownership
        if (order.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to accept bids for this order' });
        }

        // Update Accepted Bid
        bid.status = 'accepted';
        await bid.save();

        // Update Order
        order.status = 'in-progress';
        order.manufacturer = bid.manufacturer;
        order.winningBid = bid._id;
        await order.save();

        // Initialize Production Tracking
        await Production.create({
            order: order._id,
            manufacturer: bid.manufacturer,
            status: 'Waiting for Machine Allocation',
            history: [{
                status: 'Waiting for Machine Allocation',
                note: 'Order assigned to manufacturer. Waiting for machine allocation.'
            }]
        });

        // Reject other bids for this order
        await Bid.updateMany(
            { order: order._id, _id: { $ne: bid._id } },
            { $set: { status: 'rejected' } }
        );

        // Notify winner manufacturer
        await createNotification(
            bid.manufacturer,
            'Bid Accepted',
            `Congratulations! Your bid on "${order.title}" has been accepted. Please allocate machines to start production.`,
            order._id
        );

        // Notify other manufacturers who were rejected
        const rejectedBids = await Bid.find({ order: order._id, _id: { $ne: bid._id } });
        for (const b of rejectedBids) {
            await createNotification(
                b.manufacturer,
                'Bid Rejected',
                `Your bid on "${order.title}" has been rejected.`,
                order._id
            );
        }

        res.status(200).json({ message: 'Bid accepted successfully', bid, order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject a bid (Exporter)
// @route   PUT /api/bids/:id/reject
// @access  Private
const rejectBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        const order = await Order.findById(bid.order);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify Exporter Ownership
        if (order.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to reject bids for this order' });
        }

        bid.status = 'rejected';
        await bid.save();

        // Notify manufacturer
        await createNotification(
            bid.manufacturer,
            'Bid Rejected',
            `Your bid on "${order.title}" has been rejected.`,
            order._id
        );

        res.status(200).json({ message: 'Bid rejected', bid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBid,
    getMyBids,
    withdrawBid,
    getBidsForOrder,
    acceptBid,
    rejectBid
};
