# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Create `.env` file** in the root directory with the following content:

```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=chatapp

# JWT Secret Key (IMPORTANT: Change this to a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters

# AWS S3 Configuration (for media sharing)
# Get these from AWS IAM Console after creating an IAM user with S3 permissions
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Google Gemini AI Configuration (for AI suggestions)
# Get API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key
```

3. **Set up MySQL**
   - Install MySQL server (if not already installed)
   - Create the database manually:
     ```bash
     mysql -u root -p
     CREATE DATABASE chatapp;
     ```
   - Sequelize will automatically create all tables when you start the server (in development mode)
   - For production, use Sequelize migrations instead of automatic sync

4. **Set up AWS S3** (for media sharing)
   - Create an AWS account
   - Create an S3 bucket
   - Create an IAM user with S3 write permissions
   - Configure CORS on the bucket:
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
   - Add credentials to `.env`

5. **Get Gemini API Key** (for AI features)
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Add to `.env`

6. **Start the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend on http://localhost:3000

## Testing Without External Services

If you want to test without AWS S3 and Gemini AI:

1. **For AWS S3**: The media upload will fail, but text messaging will work
2. **For Gemini AI**: The AI suggestions won't work, but all other features will function

You can comment out or remove the AI routes if needed.

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running (if using local)
- Check your connection string in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Socket.IO Connection Issues
- Make sure the backend server is running on port 5000
- Check CORS settings in `server/index.js`
- Verify the token is being sent correctly

### File Upload Fails
- Verify AWS credentials in `.env`
- Check S3 bucket CORS configuration
- Ensure IAM user has proper permissions

### AI Features Not Working
- Verify Gemini API key in `.env`
- Check API quota/limits
- Review console for error messages

## Production Deployment

1. Update `CLIENT_URL` in `.env` to your production domain
2. Use MongoDB Atlas for database
3. Configure production S3 bucket with proper CORS
4. Set strong `JWT_SECRET`
5. Build frontend: `cd client && npm run build`
6. Deploy backend to hosting service (Heroku, AWS, etc.)
7. Deploy frontend to Netlify, Vercel, etc.
