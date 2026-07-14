const mongoose = require('mongoose');

const bidSchema = mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    manufacturer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    pricePerUnit: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    proposal: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Bid', bidSchema);
