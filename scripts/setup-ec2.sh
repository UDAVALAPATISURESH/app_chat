#!/bin/bash

# EC2 Setup Script
# Run this script on a fresh EC2 instance to set up everything

set -e

echo "🔧 Setting up EC2 instance for Chat App..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 18.x
echo "📦 Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
echo "📦 Installing Git..."
sudo yum install -y git

# Install MySQL (if not using RDS)
read -p "Install MySQL on this instance? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing MySQL..."
    sudo yum install -y mysql-server
    sudo systemctl start mysqld
    sudo systemctl enable mysqld
    echo "✅ MySQL installed. Run 'sudo mysql_secure_installation' to configure."
fi

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install AWS CLI
echo "📦 Installing AWS CLI..."
sudo yum install -y aws-cli

# Create logs directory
mkdir -p ~/spn/logs

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone <your-repo-url>"
echo "2. Create .env file with your configuration"
echo "3. Install dependencies: npm install && cd client && npm install"
echo "4. Build frontend: cd client && npm run build"
echo "5. Start backend: pm2 start ecosystem.config.js"
echo "6. Configure Nginx (see AWS_DEPLOYMENT.md)"
