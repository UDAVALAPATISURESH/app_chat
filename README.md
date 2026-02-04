# WhatsApp Clone - Chat Application

A full-stack real-time chat application built with React, Node.js, Socket.IO, MySQL, AWS S3, and Google Gemini AI.

## Features

- ✅ User Authentication (Sign Up & Login)
- ✅ Real-time messaging with Socket.IO
- ✅ Personal one-on-one chats
- ✅ Group chat functionality
- ✅ Media sharing (images, videos, files) via AWS S3
- ✅ AI-powered chat suggestions (Google Gemini)
  - Predictive typing suggestions
  - Smart reply suggestions
- ✅ Database optimization with archived messages
- ✅ Modern, responsive UI

## Tech Stack

### Frontend
- React 18
- React Router
- Socket.IO Client
- Axios
- CSS3

### Backend
- Node.js
- Express.js
- Socket.IO
- MySQL (mysql2)
- AWS SDK (S3)
- Google Gemini AI
- Bcrypt (password hashing)
- JWT (authentication)
- Node-cron (scheduled tasks)

## Project Structure

```
spn/
├── server/
│   ├── index.js                 # Main server file
│   ├── models/                  # MySQL models
│   ├── config/                  # Database configuration
│   │   ├── database.js         # MySQL connection
│   │   └── schema.sql          # Database schema
│   │   ├── User.js
│   │   ├── Chat.js
│   │   ├── ArchivedChat.js
│   │   └── Group.js
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── user.js
│   │   ├── media.js
│   │   └── ai.js
│   ├── middleware/              # Express middleware
│   │   └── auth.js
│   ├── socket/                  # Socket.IO handlers
│   │   ├── middleware.js
│   │   └── handlers/
│   │       ├── chat.js
│   │       ├── personalChat.js
│   │       └── groupChat.js
│   └── utils/                   # Utility functions
│       ├── archiveMessages.js
│       └── geminiAI.js
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ChatWindow.js
│   │   │   ├── ContactsList.js
│   │   │   └── MessageInput.js
│   │   ├── pages/               # Page components
│   │   │   ├── SignUp.js
│   │   │   ├── Login.js
│   │   │   └── Chat.js
│   │   ├── context/             # React context
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .env                         # Environment variables
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher, or MariaDB)
- AWS Account (for S3)
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spn
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server
   PORT=5000
   CLIENT_URL=http://localhost:3000

   # MySQL Database
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your-mysql-password
   MYSQL_DATABASE=chatapp

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # AWS S3
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-bucket-name

   # Google Gemini AI
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Set up AWS S3**
   - Create an S3 bucket
   - Configure CORS policy:
     ```json
     [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedOrigins": ["http://localhost:3000"],
         "ExposeHeaders": []
       }
     ]
     ```
   - Create an IAM user with S3 write permissions
   - Add the credentials to `.env`

5. **Start the application**
   ```bash
   npm run dev
   ```
   
   This will start both the backend server (port 5000) and frontend (port 3000).

### Running Separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/user/all` - Get all users
- `GET /api/user/verify/:email` - Verify user exists
- `GET /api/user/profile` - Get current user profile

### Chat
- `GET /api/chat/messages/:roomId` - Get messages for a room
- `GET /api/chat/archived/:roomId` - Get archived messages

### Media
- `POST /api/media/upload` - Upload file to S3

### AI
- `POST /api/ai/predictive-typing` - Get typing suggestions
- `POST /api/ai/smart-replies` - Get smart reply suggestions

## Socket.IO Events

### Client to Server
- `join_room` - Join a personal chat room
- `leave_room` - Leave a room
- `send_personal_message` - Send personal message
- `join_group` - Join a group chat
- `leave_group` - Leave a group
- `send_group_message` - Send group message

### Server to Client
- `new_message` - New message received
- `room_joined` - Successfully joined a room
- `group_joined` - Successfully joined a group
- `error` - Error occurred

## Database Schema

### User
- name, email, phone, password, avatar, createdAt

### Chat
- senderId, receiverId, groupId, message, messageType, mediaUrl, roomId, timestamp

### ArchivedChat
- Same as Chat, plus archivedAt timestamp

### Group
- name, description, admin, members[], avatar, createdAt

## Features in Detail

### Real-time Messaging
- Uses Socket.IO for bidirectional communication
- Messages are stored in MySQL
- Automatic reconnection on disconnect

### Media Sharing
- Files uploaded to AWS S3
- Supports images, videos, and documents
- Secure file access with public URLs

### AI Features
- **Predictive Typing**: Suggests next words/phrases as user types
- **Smart Replies**: Provides context-aware quick reply options

### Database Optimization
- Cron job runs daily at 2 AM
- Moves messages older than 1 day to archived_chats table
- Keeps main chats table lightweight for faster queries

## Deployment

1. Set production environment variables
2. Build the frontend: `cd client && npm run build`
3. Deploy backend to your hosting service (Heroku, AWS, etc.)
4. Configure MySQL database for production
5. Update CORS settings for production domain
6. Deploy frontend to Netlify, Vercel, or similar

## License

ISC

## Author

Built as part of a comprehensive chat application project.
# app_chat
