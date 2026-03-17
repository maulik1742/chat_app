const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');
const Message = require('./models/Message');
const Chat = require('./models/Chat');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => res.send('Talksy API is running...'));
app.use('/api/chat', chatRoutes);

// Socket.io initialization
const io = new Server(server, {
    cors: {
        origin: '*', // For development, allow all origins.
        methods: ['GET', 'POST'],
    },
});

// Socket.io event handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a specific chat room
    socket.on('joinChat', (chatId) => {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // Handle new messages
    socket.on('sendMessage', async (messageData) => {
        try {
            const { chatId, senderId, text } = messageData;

            // Check if receiver is online in this room
            const clientsInRoom = io.sockets.adapter.rooms.get(chatId);
            const isReceiverOnline = clientsInRoom && clientsInRoom.size > 1;

            // Save message to MongoDB
            const newMessage = new Message({
                chatId,
                senderId,
                text,
                status: isReceiverOnline ? 'delivered' : 'sent'
            });

            await newMessage.save();

            // Update chat's lastMessage for recent chat lists
            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: newMessage._id
            });

            // Emit received message to everyone in the room (including sender)
            io.to(chatId).emit('receiveMessage', newMessage);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    // Handle user typing
    socket.on('typing', ({ chatId, senderId }) => {
        socket.to(chatId).emit('userTyping', { senderId });
    });

    // Handle message deletion
    socket.on('deleteMessage', ({ chatId, messageId }) => {
        io.to(chatId).emit('messageDeleted', { messageId, chatId });
    });

    // Handle message delivery status
    socket.on('messageDelivered', async ({ messageId, chatId }) => {
        try {
            await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
            io.to(chatId).emit('messageStatusUpdated', { messageId, status: 'delivered' });
        } catch (error) {
            console.error('Error updating delivery status:', error);
        }
    });

    // Handle message seen status
    socket.on('messagesSeen', async ({ chatId, userId }) => {
        try {
            // Update all 'sent' or 'delivered' messages not from this user to 'seen'
            await Message.updateMany(
                { chatId, senderId: { $ne: userId }, status: { $ne: 'seen' } },
                { status: 'seen' }
            );
            io.to(chatId).emit('messagesStatusSeen', { chatId, readerId: userId });
        } catch (error) {
            console.error('Error updating seen status:', error);
        }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
