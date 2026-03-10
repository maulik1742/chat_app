# 🚀 Premium Real-Time Chat Application

A high-performance, full-stack live chat application built with modern technologies. This project features real-time messaging, secure user authentication, and a stunning "Premium Dark" glassmorphism interface.

---

## ✨ Features

- **Real-Time Messaging**: Instant message delivery using Socket.io.
- **Secure Authentication**: JWT-based registration and login with encrypted passwords (BCrypt).
- **Conversation Management**: Chat-wise data storage to retrieve recent conversations indexed by user.
- **User Discovery**: Search and start chats with any registered user.
- **Responsive Design**: A beautiful, mobile-ready UI built with Tailwind CSS and Lucide icons.
- **State Management**: Standard Redux (Actions/Reducers) for efficient global state handling.
- **Persistent Session**: Stay logged in even after refreshing the page.

---

## 🛠 Tech Stack

### **Frontend**

- **Next.js 14+** (App Router)
- **Tailwind CSS** (Styling & Glassmorphism)
- **Redux** (State Management)
- **TypeScript** (Type Safety)
- **Socket.io-client** (Real-time Communication)
- **Axios** (API Interceptors for JWT)

### **Backend**

- **Node.js & Express** (Server)
- **MongoDB & Mongoose** (Database & Modeling)
- **Socket.io** (WebSockets)
- **jsonwebtoken (JWT)** (Secure Auth)
- **bcryptjs** (Password Hashing)

---

## 📂 Project Structure

```bash
chat_app/
├── backend/                # Node.js/Express Server
│   ├── config/             # Database Connection
│   ├── middleware/         # Auth Protection
│   ├── models/             # Mongoose Schemas (User, Chat, Message)
│   ├── routes/             # API Endpoints
│   └── index.js            # Entry Point & Socket Logic
├── frontend/               # Next.js Application
│   ├── src/
│   │   ├── app/            # App Router & Layout
│   │   ├── components/     # UI Components (ChatApp, StoreProvider)
│   │   ├── lib/            # API Config, Socket Initializer, Shared Types
│   │   └── store/          # Redux Store, Actions, and Reducers
│   └── tailwind.config.ts  # Design System Tokens
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites

- Node.js installed
- MongoDB running locally or a MongoDB Atlas URI

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat_app
JWT_SECRET=your_secret_key_here
```

Run the server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Run the application:

```bash
npm run dev
```

---

## 🔌 API Endpoints

| Method | Endpoint                 | Description                    | Auth |
| :----- | :----------------------- | :----------------------------- | :--- |
| POST   | `/api/chat/register`     | Register a new user            | No   |
| POST   | `/api/chat/login`        | Authenticate & get token       | No   |
| GET    | `/api/chat/users/:id`    | Get all users except self      | Yes  |
| GET    | `/api/chat/list/:id`     | Get recent conversation list   | Yes  |
| GET    | `/api/chat/messages/:id` | Get message history for a chat | Yes  |
| POST   | `/api/chat/start`        | Create or find a conversation  | Yes  |

---

## 🎨 UI Aesthetics

This app utilizes a **Premium Dark Theme** with:

- **Neutral-950** background for depth.
- **Glassmorphism** effects with `backdrop-blur`.
- **Vibrant Gradients** (Blue/Indigo) for active states.
- **Micro-animations** using Tailwind's transition utilities.
- **Auto-scrolling** to the latest messages in the chat window.

---

## 🚀 Future Roadmap

- [ ] Online/Offline presence indicators.
- [ ] Typing indicators.
- [ ] Image and file sharing.
- [ ] Group chat support.
- [ ] Message read receipts.

---

## 📄 License

MIT License - feel free to use this for your own projects!
