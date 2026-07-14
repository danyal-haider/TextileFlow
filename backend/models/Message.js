const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    attachment: {
        url: {
            type: String,
            default: ''
        },
        name: {
            type: String,
            default: ''
        },
        mimeType: {
            type: String,
            default: ''
        }
    }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
