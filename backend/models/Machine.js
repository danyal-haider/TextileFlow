const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['cutting', 'sewing', 'printing', 'embroidery'],
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Busy', 'Under Maintenance'],
        default: 'Available'
    }
}, {
    timestamps: true
});

const Machine = mongoose.model('Machine', machineSchema);

module.exports = Machine;
