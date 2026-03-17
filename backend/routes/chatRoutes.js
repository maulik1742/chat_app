const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// --- User Routes ---

// 1. Register User
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Get all users (except current) - Protected
router.get('/users/:currentUserId', protect, async (req, res) => {
    try {
        const { currentUserId } = req.params;
        const users = await User.find({ _id: { $ne: currentUserId } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Chat Routes ---

// 4. Start or find a conversation between two users - Protected
router.post('/start', protect, async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        const mongoose = require('mongoose');

        const senderObjectId = new mongoose.Types.ObjectId(senderId);
        const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

        let chat = await Chat.findOne({
            participants: { $all: [senderObjectId, receiverObjectId] }
        }).populate('participants', 'username email');

        if (!chat) {
            chat = new Chat({
                participants: [senderObjectId, receiverObjectId]
            });
            await chat.save();
            chat = await Chat.findById(chat._id).populate('participants', 'username email');
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 5. Get all conversations (recent chats) for a specific user - Protected
router.get('/list/:userId', protect, async (req, res) => {
    try {
        const { userId } = req.params;

        const chats = await Chat.find({
            participants: { $in: [userId] }
        })
            .sort({ updatedAt: -1 })
            .populate('lastMessage')
            .populate('participants', 'username email');

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 6. Get all messages for a specific conversation - Protected
router.get('/messages/:chatId', protect, async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
