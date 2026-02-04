# AWS Free Tier Deployment Guide

This guide will help you deploy your chat application on AWS using **100% free tier services**.

## 🆓 AWS Free Tier Services Used

1. **EC2 t2.micro** - Backend server (750 hours/month free for 12 months)
2. **RDS MySQL db.t2.micro** - Database (750 hours/month free for 12 months) OR MySQL on EC2
3. **S3** - Frontend hosting + Media storage (5GB free forever)
4. **CloudFront** - CDN for frontend (50GB free forever)
5. **Route 53** - Optional domain (not free, but you can use free alternatives)

## 📋 Prerequisites

- AWS Account (create at aws.amazon.com)
- Domain name (optional, can use EC2 public IP)
- Basic knowledge of Linux commands

---

## 🗄️ Step 1: Set Up MySQL Database

### Option A: RDS MySQL (Recommended - Easier)

1. **Go to RDS Console** → Create Database
2. **Select MySQL** → Free tier template
3. **Settings:**
   - DB instance identifier: `chatapp-db`
   - Master username: `admin`
   - Master password: `[create-strong-password]`
   - DB instance class: `db.t2.micro` (Free tier eligible)
   - Storage: 20 GB (free tier)
   - Public access: **Yes** (or configure VPC security groups)
4. **Create database**
5. **Note the endpoint** (e.g., `chatapp-db.xxxxx.us-east-1.rds.amazonaws.com`)

### Option B: MySQL on EC2 (More control, same instance)

Install MySQL directly on your EC2 instance (see Step 2).

---

## 🖥️ Step 2: Launch EC2 Instance

1. **Go to EC2 Console** → Launch Instance
2. **Name:** `chatapp-server`
3. **AMI:** Amazon Linux 2023 (Free tier eligible)
4. **Instance type:** `t2.micro` (Free tier eligible)
5. **Key pair:** Create new or use existing
6. **Network settings:**
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
   - Allow Custom TCP (port 5000) from anywhere (for API)
7. **Storage:** 8 GB gp3 (Free tier: 30 GB)
8. **Launch instance**

### Configure Security Group

After launch, edit Security Group:
- **Inbound Rules:**
  - SSH (22) - Your IP
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0
  - Custom TCP (5000) - 0.0.0.0/0 (for API)
  - Custom TCP (3000) - 0.0.0.0/0 (if testing frontend on EC2)

---

## 🔧 Step 3: Set Up EC2 Instance

### Connect to EC2

```bash
# On Windows (PowerShell)
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# On Mac/Linux
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### Install Required Software

```bash
# Update system
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install MySQL (if not using RDS)
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Clone Your Repository

```bash
cd /home/ec2-user
git clone https://github.com/your-username/your-repo.git
cd spn  # or your project folder name
```

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

---

## ⚙️ Step 4: Configure Environment Variables

Create `.env` file on EC2:

```bash
nano /home/ec2-user/spn/.env
```

Add these values:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-domain.com

# MySQL Configuration (RDS or EC2)
MYSQL_HOST=your-rds-endpoint.amazonaws.com
# OR if MySQL on EC2:
# MYSQL_HOST=localhost
MYSQL_USER=admin
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=chatapp

# JWT Secret (generate strong random string)
JWT_SECRET=your-very-strong-random-secret-key-minimum-32-characters

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ Step 5: Set Up Database

### If using RDS:
- Database is already created, just ensure connection works

### If using MySQL on EC2:

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database
mysql -u root -p
CREATE DATABASE chatapp;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON chatapp.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Initialize Database Tables

```bash
cd /home/ec2-user/spn
node -e "require('./models').sequelize.sync({ alter: false })"
```

---

## 🚀 Step 6: Build and Start Backend

### Build Frontend (for S3 deployment)

```bash
cd /home/ec2-user/spn/client
npm run build
```

### Start Backend with PM2

```bash
cd /home/ec2-user/spn
pm2 start server/index.js --name chatapp-backend
pm2 save
pm2 startup
```

**PM2 Commands:**
```bash
pm2 list              # View running processes
pm2 logs chatapp-backend  # View logs
pm2 restart chatapp-backend  # Restart
pm2 stop chatapp-backend     # Stop
```

---

## 🌐 Step 7: Configure Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/conf.d/chatapp.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your EC2 public IP

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend (if serving from EC2, otherwise remove this)
    location / {
        root /home/ec2-user/spn/client/build;
        try_files $uri $uri/ /index.html;
    }
}
```

**Test and restart Nginx:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📦 Step 8: Deploy Frontend to S3 + CloudFront

### Create S3 Bucket

1. **Go to S3 Console** → Create bucket
2. **Name:** `your-app-frontend` (must be globally unique)
3. **Region:** Same as EC2 (e.g., us-east-1)
4. **Block Public Access:** Uncheck (we need public access)
5. **Create bucket**

### Configure S3 Bucket

1. **Properties** → Static website hosting
   - Enable static website hosting
   - Index document: `index.html`
   - Error document: `index.html` (for React Router)

2. **Permissions** → Bucket Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-app-frontend/*"
    }
  ]
}
```

3. **CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### Upload Frontend Build

```bash
# Install AWS CLI (if not installed)
sudo yum install -y aws-cli

# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter region: us-east-1
# Enter output format: json

# Upload build files
cd /home/ec2-user/spn/client
aws s3 sync build/ s3://your-app-frontend --delete
```

### Set Up CloudFront (Optional but Recommended)

1. **Go to CloudFront Console** → Create Distribution
2. **Origin Domain:** Select your S3 bucket
3. **Viewer Protocol Policy:** Redirect HTTP to HTTPS
4. **Default Root Object:** `index.html`
5. **Create Distribution**
6. **Wait 5-10 minutes** for deployment
7. **Note the CloudFront URL** (e.g., `d1234567890.cloudfront.net`)

**Update React App:**
- Update `CLIENT_URL` in `.env` to your CloudFront URL
- Rebuild and re-upload to S3

---

## 🔐 Step 9: Set Up SSL Certificate (HTTPS)

### Using AWS Certificate Manager (Free)

1. **Go to Certificate Manager** → Request certificate
2. **Domain name:** `your-domain.com` and `*.your-domain.com`
3. **Validation:** DNS validation
4. **Add DNS records** to your domain provider
5. **Wait for validation** (5-10 minutes)

### Configure CloudFront with SSL

1. **Edit CloudFront Distribution**
2. **Alternate Domain Names:** Add your domain
3. **SSL Certificate:** Select your certificate
4. **Save**

### Configure Nginx with SSL (If using EC2 directly)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🔄 Step 10: Update Frontend Configuration

Update `client/src/utils/axiosConfig.js` to use your production API:

```javascript
// Change baseURL to your EC2 public IP or domain
const api = axios.create({
  baseURL: 'https://your-domain.com',  // or http://your-ec2-ip
  // ...
});
```

Rebuild and redeploy:
```bash
cd /home/ec2-user/spn/client
npm run build
aws s3 sync build/ s3://your-app-frontend --delete
```

---

## 📊 Step 11: Monitoring and Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs chatapp-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u nginx -f
```

### Auto-restart on Reboot

PM2 startup is already configured, but verify:
```bash
pm2 startup
pm2 save
```

### Update Application

```bash
cd /home/ec2-user/spn
git pull
npm install
cd client
npm install
npm run build
cd ..
pm2 restart chatapp-backend
aws s3 sync client/build/ s3://your-app-frontend --delete
```

---

## 💰 Cost Estimation (Free Tier)

### Within Free Tier (First 12 Months):
- **EC2 t2.micro:** Free (750 hours/month)
- **RDS db.t2.micro:** Free (750 hours/month)
- **S3:** Free (5 GB storage, 20,000 GET requests)
- **CloudFront:** Free (50 GB data transfer)
- **Data Transfer:** Free (1 GB/month out)

### After Free Tier:
- **EC2 t2.micro:** ~$8-10/month
- **RDS db.t2.micro:** ~$15/month
- **S3:** ~$0.023/GB/month
- **CloudFront:** ~$0.085/GB

**Total:** ~$25-30/month after free tier expires

---

## 🐛 Troubleshooting

### Backend not starting?
```bash
pm2 logs chatapp-backend
# Check for errors in logs
```

### Database connection failed?
```bash
# Test MySQL connection
mysql -h your-rds-endpoint -u admin -p
# Check security groups allow EC2 to access RDS
```

### Frontend not loading?
- Check S3 bucket permissions
- Verify CloudFront distribution is deployed
- Check browser console for errors
- Verify API URL in axiosConfig.js

### Socket.IO not connecting?
- Check Nginx configuration for `/socket.io` location
- Verify CORS settings in server
- Check firewall rules

---

## ✅ Deployment Checklist

- [ ] EC2 instance launched and configured
- [ ] MySQL database set up (RDS or EC2)
- [ ] Environment variables configured
- [ ] Backend running with PM2
- [ ] Nginx configured and running
- [ ] Frontend built and uploaded to S3
- [ ] CloudFront distribution created
- [ ] SSL certificate configured
- [ ] Domain name configured (optional)
- [ ] Security groups configured
- [ ] All features tested

---

## 🎉 You're Done!

Your chat application is now live on AWS! 

**Access your app:**
- Frontend: `https://your-cloudfront-url.cloudfront.net`
- Backend API: `https://your-domain.com/api` or `http://your-ec2-ip/api`

**Next Steps:**
- Set up monitoring with CloudWatch
- Configure auto-scaling (if needed)
- Set up automated backups
- Configure domain name
- Set up CI/CD pipeline
