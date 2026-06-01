# Zentrix Chat

A full-stack real-time chat application with a sleek dark-mode UI inspired by the Zentrix design language. Built with React, Tailwind CSS, Node.js, Express, Socket.io, and MySQL.

## Features

- **User Authentication**: JWT-based registration and login with bcrypt password hashing
- **Real-time Messaging**: Bidirectional communication via Socket.io
- **One-on-One Chat**: Private messaging between users
- **Group Chats**: Create groups with multiple members and admin roles
- **Read Receipts**: Single tick (sent), double tick (delivered), green double tick (read)
- **Emoji Picker**: Built-in emoji selection using emoji-mart
- **File Sharing**: Upload and share images and documents (up to 5MB)
- **Message Reactions**: React with emojis (👍 ❤️ 😂 😮 😢 🎉)
- **Edit & Delete**: Modify or remove your own messages
- **Typing Indicators**: See when someone is typing
- **Online Status**: Real-time user status (online/away/offline)
- **Message Search**: Search through conversation history
- **User Profiles**: Update display name, avatar, and status
- **Responsive Design**: Works on both desktop and mobile

## Tech Stack

### Frontend
- React 19 + TypeScript
- Tailwind CSS
- Socket.io Client
- emoji-mart
- Lucide Icons
- Axios

### Backend
- Node.js + Express
- Socket.io
- Sequelize ORM
- MySQL
- JWT + bcrypt
- Multer (file uploads)

## Getting Started

### Prerequisites
- Node.js 20+
- MySQL 8+

### Database Setup

1. Create a MySQL database:
```bash
mysql -u root -p -e "CREATE DATABASE zentrix_chat;"
```

2. The application uses Sequelize `sync({ alter: true })` which auto-creates tables on first run.

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=zentrix_chat
JWT_SECRET=your-secret-key
PORT=3001
CLIENT_URL=http://localhost:3000
```

### Running the Application

Development mode (runs both frontend and backend):
```bash
npm run dev
```

This starts:
- Backend server on http://localhost:3001
- Frontend dev server on http://localhost:3000

### Production Build

```bash
npm run build
```

This creates an optimized production build in `dist/`.

## Project Structure

```
├── server/                  # Backend
│   ├── config/             # Database configuration
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── middleware/         # Auth & upload middleware
│   ├── socket/             # Socket.io handlers
│   ├── uploads/            # Uploaded files
│   └── index.ts            # Server entry point
├── src/                     # Frontend
│   ├── components/
│   │   ├── chat/           # Chat components
│   │   └── modals/         # Modal components
│   ├── context/            # React contexts
│   ├── lib/                # Utility functions
│   └── pages/              # Page components
├── .env                     # Environment variables
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/users/search` - Search users

### Conversations
- `GET /api/conversations` - List user's conversations
- `POST /api/conversations/direct` - Start direct chat
- `POST /api/conversations/group` - Create group
- `POST /api/conversations/:id/leave` - Leave group

### Messages
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message (REST)
- `PUT /api/conversations/:id/messages/:msgId` - Edit message
- `DELETE /api/conversations/:id/messages/:msgId` - Delete message
- `POST /api/conversations/:id/messages/:msgId/reactions` - Toggle reaction

### Upload
- `POST /api/upload` - Upload file

## WebSocket Events

### Client → Server
- `conversation:join` - Join a conversation room
- `conversation:leave` - Leave a conversation room
- `message:send` - Send a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:read` - Mark message as read
- `message:edit` - Edit a message
- `message:delete` - Delete a message
- `reaction:toggle` - Toggle reaction
- `user:status` - Update user status

### Server → Client
- `message:receive` - New message received
- `message:edited` - Message was edited
- `message:deleted` - Message was deleted
- `message:read_update` - Read receipt update
- `reaction:update` - Reaction update
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:status_change` - User status changed

## License

MIT
