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
app.get('/', (req, res) => res.send('Chat API is running...'));
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

            // Save message to MongoDB
            const newMessage = new Message({
                chatId,
                senderId,
                text,
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

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
