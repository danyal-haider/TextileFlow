require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Message = require('./models/Message');
const Order = require('./models/Order');
const { createNotification } = require('./controllers/notificationController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Set global io variable so controllers can access it
global.io = io;

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/bids', require('./routes/bidRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/machines', require('./routes/machineRoutes'));
app.use('/api/production', require('./routes/productionRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/qc', require('./routes/qcRoutes'));

app.get('/', (req, res) => {
    res.send('Textile Flow API is running');
});

// Socket.io Real-Time Connections
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join order chat room
    socket.on('join_room', ({ orderId }) => {
        socket.join(orderId);
        console.log(`User ${socket.id} joined room: ${orderId}`);
    });

    // Join private notifications channel for the user
    socket.on('join_notifications', ({ userId }) => {
        socket.join(userId);
        console.log(`User ${socket.id} joined private notification channel: ${userId}`);
    });

    // Listen for incoming messages
    socket.on('send_message', async ({ orderId, senderId, text, attachment }) => {
        try {
            // Save to Database
            const msg = await Message.create({
                order: orderId,
                sender: senderId,
                text: text || '',
                attachment: attachment || { url: '', name: '', mimeType: '' }
            });

            // Populate sender info
            const populatedMsg = await Message.findById(msg._id).populate('sender', 'name email role');

            // Emit to the order room
            io.to(orderId).emit('receive_message', populatedMsg);

            // Notify recipient
            const orderObj = await Order.findById(orderId);
            if (orderObj) {
                const recipientId = orderObj.user.toString() === senderId ? orderObj.manufacturer : orderObj.user;
                if (recipientId) {
                    await createNotification(
                        recipientId,
                        'New Chat Message',
                        `You have a new message: "${text ? (text.length > 30 ? text.substring(0, 30) + '...' : text) : 'Attachment'}"`,
                        orderId
                    );
                }
            }
        } catch (error) {
            console.error('Socket send_message error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
