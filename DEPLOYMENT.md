# Deployment Guide

> **For AWS Free Tier Deployment, see [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)**

## Pre-Deployment Checklist

- [ ] Update all environment variables for production
- [ ] Set strong JWT_SECRET
- [ ] Configure MySQL database (RDS or EC2)
- [ ] Set up AWS S3 bucket with production CORS
- [ ] Update CLIENT_URL to production domain
- [ ] Test all features locally
- [ ] Build frontend for production

## Environment Variables for Production

Create a `.env` file with production values:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-domain.com

# MySQL Configuration
MYSQL_HOST=your-rds-endpoint.amazonaws.com
MYSQL_USER=admin
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=chatapp

JWT_SECRET=your-very-strong-random-secret-key-minimum-32-characters

AWS_ACCESS_KEY_ID=your-production-aws-key
AWS_SECRET_ACCESS_KEY=your-production-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-production-bucket

GEMINI_API_KEY=your-gemini-api-key
```

## Backend Deployment

### Option 1: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=your-uri
   heroku config:set JWT_SECRET=your-secret
   # ... set all other variables
   ```
5. Deploy: `git push heroku main`

### Option 2: AWS EC2

1. Launch EC2 instance
2. Install Node.js and MongoDB
3. Clone repository
4. Set up PM2: `npm install -g pm2`
5. Start: `pm2 start server/index.js`
6. Configure nginx as reverse proxy

### Option 3: Railway / Render

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

## Frontend Deployment

### Option 1: Netlify

1. Build: `cd client && npm run build`
2. Drag and drop `client/build` folder to Netlify
3. Or connect GitHub for auto-deploy
4. Set environment variable: `REACT_APP_SERVER_URL=https://your-backend-url.com`

### Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. In client folder: `vercel`
3. Set environment variables in Vercel dashboard

### Option 3: AWS S3 + CloudFront

1. Build: `cd client && npm run build`
2. Upload `build` folder to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain

## MongoDB Atlas Setup

1. Create cluster at mongodb.com/cloud/atlas
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for all, or specific IPs)
4. Get connection string
5. Add to `.env` as `MONGODB_URI`

## AWS S3 Setup for Production

1. Create S3 bucket
2. Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": [
         "https://your-frontend-domain.com",
         "http://localhost:3000"
       ],
       "ExposeHeaders": []
     }
   ]
   ```
3. Create IAM user with S3 permissions
4. Add credentials to `.env`

## Post-Deployment

1. Test all features:
   - User signup/login
   - Real-time messaging
   - Media uploads
   - AI suggestions
2. Monitor logs for errors
3. Set up error tracking (Sentry, etc.)
4. Configure SSL certificates
5. Set up domain names

## Monitoring

- Use PM2 for process management (if on VPS)
- Set up health check endpoints
- Monitor database performance
- Track API response times
- Set up alerts for errors

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Strong JWT_SECRET (32+ characters)
- [ ] MongoDB connection string secured
- [ ] AWS credentials secured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] Error messages don't expose sensitive info
