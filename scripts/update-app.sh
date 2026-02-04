#!/bin/bash

# Update Application Script
# Run this to update your deployed application

set -e

echo "🔄 Updating application..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install
cd client
npm install
cd ..

# Build frontend
echo "🏗️  Building frontend..."
cd client
npm run build
cd ..

# Restart backend
echo "🔄 Restarting backend..."
pm2 restart chatapp-backend

# Upload to S3 (if AWS_S3_BUCKET_NAME is set)
if [ ! -z "$AWS_S3_BUCKET_NAME" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 sync client/build/ s3://$AWS_S3_BUCKET_NAME --delete
fi

echo "✅ Update complete!"
