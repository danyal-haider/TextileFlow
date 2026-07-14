const Message = require('../models/Message');
const Order = require('../models/Order');

// @desc    Get chat messages for an order
// @route   GET /api/chat/:orderId
// @access  Private (Exporter or assigned Manufacturer only)
const getChatHistory = async (req, res) => {
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
            return res.status(403).json({ message: 'Not authorized to view this chat' });
        }

        const messages = await Message.find({ order: orderId })
            .sort({ createdAt: 1 })
            .populate('sender', 'name email role');

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getChatHistory
};
