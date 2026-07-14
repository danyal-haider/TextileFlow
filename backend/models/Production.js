const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
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
    allocatedMachines: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machine'
    }],
    estStartDate: {
        type: Date
    },
    estEndDate: {
        type: Date
    },
    status: {
        type: String,
        enum: [
            'Waiting for Machine Allocation',
            'Production Started',
            'Cutting',
            'Stitching',
            'Finishing',
            'Packing',
            'Production Completed'
        ],
        default: 'Waiting for Machine Allocation'
    },
    history: [{
        status: {
            type: String,
            required: true
        },
        note: {
            type: String,
            default: ''
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const Production = mongoose.model('Production', productionSchema);

module.exports = Production;
