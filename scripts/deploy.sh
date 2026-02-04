#!/bin/bash

# AWS Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Load environment variables
source .env

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
cd client
npm install
cd ..

echo -e "${YELLOW}🏗️  Building frontend...${NC}"
cd client
npm run build
cd ..

echo -e "${YELLOW}🔄 Restarting backend with PM2...${NC}"
pm2 restart chatapp-backend || pm2 start ecosystem.config.js

echo -e "${YELLOW}☁️  Uploading frontend to S3...${NC}"
if [ -z "$AWS_S3_BUCKET_NAME" ]; then
    echo -e "${RED}❌ AWS_S3_BUCKET_NAME not set in .env${NC}"
    exit 1
fi

aws s3 sync client/build/ s3://$AWS_S3_BUCKET_NAME --delete

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}📊 Check status: pm2 status${NC}"
echo -e "${GREEN}📝 View logs: pm2 logs chatapp-backend${NC}"
