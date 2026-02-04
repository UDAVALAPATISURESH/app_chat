# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm run install-all
```

### Step 2: Create `.env` File
Copy this template and fill in your values:

```env
PORT=5000
CLIENT_URL=http://localhost:3000

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=chatapp

# JWT Secret - Change this!
JWT_SECRET=change-this-to-a-random-32-character-string

# AWS S3 (Optional - for media sharing)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket

# Gemini AI (Optional - for AI suggestions)
GEMINI_API_KEY=your-key
```

### Step 3: Set up MySQL Database
1. Make sure MySQL is installed and running
2. Create the database manually:
   ```bash
   mysql -u root -p
   CREATE DATABASE chatapp;
   ```
3. Sequelize will automatically create all tables when you start the server

### Step 4: Run the Application
```bash
npm run dev
```

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Step 5: Test the App
1. Open http://localhost:3000
2. Click "Sign Up"
3. Create an account
4. Login
5. Search for another user by email
6. Start chatting!

## ⚡ Quick Test Without External Services

You can test the app without AWS S3 and Gemini AI:
- Text messaging will work perfectly
- Media uploads will fail (but that's okay for testing)
- AI suggestions won't work (but chat will function)

## 🐛 Troubleshooting

**MySQL Connection Error?**
- Make sure MySQL server is running
- Check your MySQL credentials in `.env`
- Verify the database exists: `mysql -u root -p -e "SHOW DATABASES;"`
- Create the database if it doesn't exist: `CREATE DATABASE chatapp;`
- Sequelize will automatically create tables on first run (in development mode)

**Socket.IO Not Connecting?**
- Check backend is running on port 5000
- Verify token in browser console
- Check CORS settings

**Port Already in Use?**
- Change `PORT` in `.env`
- Or kill the process using the port

## 📚 Next Steps

- Read [SETUP.md](SETUP.md) for detailed setup
- Read [FEATURES.md](FEATURES.md) for feature list
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

## 🎉 You're Ready!

The app is now running. Create accounts and start chatting!
