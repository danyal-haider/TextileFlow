const mongoose = require('mongoose');

const qcReportSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    manufacturer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: {
        type: String,
        required: true
    },
    inspectionNotes: {
        type: String,
        default: ''
    },
    productImages: [{
        type: String
    }],
    defectImages: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['Passed', 'Failed', 'Pending'],
        default: 'Pending'
    },
    // Exporter review fields
    reviewedAt: {
        type: Date
    },
    reviewComments: {
        type: String,
        default: ''
    },
    defectDescription: {
        type: String,
        default: ''
    },
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

const QcReport = mongoose.model('QcReport', qcReportSchema);

module.exports = QcReport;
