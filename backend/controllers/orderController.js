const Order = require('../models/Order');

// @desc    Get orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    const orders = await Order.find()
        .populate('user', 'name email companyName role profilePic phone country city address about')
        .populate('manufacturer', 'name email companyName role profilePic phone country city address about');
    res.status(200).json(orders);
};

// @desc    Set order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    const {
        title,
        description,
        quantity,
        price,
        material,
        color,
        size,
        noOfLogos,
        category,
        gender,
        sizes,
        sizeBreakdown,
        customizationType,
        logoPlacement,
        targetPrice,
        sampleRequired,
        deadline
    } = req.body;

    if (!quantity || !category || (Array.isArray(category) && category.length === 0)) {
        res.status(400).json({ message: 'Please provide quantity and category' });
        return;
    }

    const orderTitle = title || `${Array.isArray(category) ? category.join(', ') : category} Order - ${quantity} pcs`;

    try {
        const order = await Order.create({
            title: orderTitle,
            description: description || '',
            quantity: Number(quantity),
            price: price || 0,
            material,
            color,
            size, // keeping legacy size input
            noOfLogos: Number(noOfLogos) || 0, // keeping legacy logo count
            category,
            gender: gender || 'Unisex',
            sizes: sizes || [],
            sizeBreakdown: sizeBreakdown || '',
            customizationType: customizationType || 'None',
            logoPlacement: logoPlacement || '',
            targetPrice: targetPrice ? Number(targetPrice) : undefined,
            sampleRequired: sampleRequired === true || sampleRequired === 'true',
            deadline,
            user: req.user.id
        });

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Check user
        if (order.user.toString() !== req.user.id) {
            res.status(401);
            throw new Error('User not authorized');
        }

        if (order.status !== 'pending') {
            res.status(400);
            throw new Error('Cannot delete non-pending order');
        }

        await Order.findByIdAndDelete(req.params.id);
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Check user
        if (order.user.toString() !== req.user.id) {
            res.status(401);
            throw new Error('User not authorized');
        }

        if (order.status !== 'pending') {
            res.status(400);
            throw new Error('Cannot update non-pending order');
        }

        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });

        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single order detail
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email companyName role profilePic phone country city address about')
            .populate('manufacturer', 'name email companyName role profilePic phone country city address about');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getOrders,
    createOrder,
    deleteOrder,
    updateOrder,
    getOrderById
};
