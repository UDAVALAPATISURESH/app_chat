# AWS Deployment Quick Start

## 🚀 Fastest Way to Deploy (Step-by-Step)

### 1. Create AWS Account
- Go to [aws.amazon.com](https://aws.amazon.com)
- Sign up (requires credit card, but free tier won't charge you)

### 2. Launch EC2 Instance (5 minutes)

1. **EC2 Console** → Launch Instance
2. **Settings:**
   - Name: `chatapp-server`
   - AMI: Amazon Linux 2023
   - Instance: t2.micro (Free tier)
   - Key pair: Create new (download .pem file)
   - Security Group: Allow SSH (22), HTTP (80), HTTPS (443), Custom TCP (5000)
3. **Launch**

### 3. Connect to EC2

```bash
# Windows (PowerShell)
ssh -i your-key.pem ec2-user@YOUR-EC2-IP

# Mac/Linux
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR-EC2-IP
```

### 4. Run Setup Script

```bash
# On EC2 instance
curl -O https://raw.githubusercontent.com/your-repo/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

Or manually:
```bash
sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git nginx aws-cli
sudo npm install -g pm2
```

### 5. Clone Your Repository

```bash
cd /home/ec2-user
git clone YOUR_REPO_URL
cd spn
npm install
cd client && npm install && cd ..
```

### 6. Create RDS MySQL Database (5 minutes)

1. **RDS Console** → Create Database
2. **MySQL** → Free tier template
3. **Settings:**
   - Identifier: `chatapp-db`
   - Username: `admin`
   - Password: `[strong-password]`
   - Instance: `db.t2.micro`
   - Public access: Yes
4. **Create**
5. **Note the endpoint** (e.g., `chatapp-db.xxxxx.us-east-1.rds.amazonaws.com`)

### 7. Configure Environment Variables

```bash
nano .env
```

Paste this (update with your values):
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-cloudfront-url.cloudfront.net

MYSQL_HOST=chatapp-db.xxxxx.us-east-1.rds.amazonaws.com
MYSQL_USER=admin
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=chatapp

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

GEMINI_API_KEY=your-key
```

### 8. Initialize Database

```bash
node -e "require('./models').sequelize.sync({ alter: false })"
```

### 9. Start Backend

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 10. Configure Nginx

```bash
sudo nano /etc/nginx/conf.d/chatapp.conf
```

Paste from `nginx.conf.example`, update server_name:
```nginx
server {
    listen 80;
    server_name YOUR-EC2-IP;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 11. Create S3 Bucket for Frontend

1. **S3 Console** → Create bucket
2. **Name:** `your-app-frontend` (globally unique)
3. **Uncheck** "Block all public access"
4. **Enable** static website hosting
5. **Index document:** `index.html`
6. **Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-app-frontend/*"
  }]
}
```

### 12. Build and Upload Frontend

```bash
cd client
npm run build
aws s3 sync build/ s3://your-app-frontend --delete
```

### 13. Create CloudFront Distribution

1. **CloudFront Console** → Create Distribution
2. **Origin:** Your S3 bucket
3. **Viewer Protocol:** Redirect HTTP to HTTPS
4. **Default Root Object:** `index.html`
5. **Create**
6. **Wait 5-10 minutes**

### 14. Update Frontend API URL

Edit `client/src/utils/axiosConfig.js`:
```javascript
const api = axios.create({
  baseURL: 'http://YOUR-EC2-IP',  // or your domain
  // ...
});
```

Rebuild and redeploy:
```bash
cd client
npm run build
aws s3 sync build/ s3://your-app-frontend --delete
```

## ✅ Test Your Deployment

1. **Backend API:** `http://YOUR-EC2-IP/api/user/profile`
2. **Frontend:** `https://YOUR-CLOUDFRONT-URL.cloudfront.net`

## 🔄 Update Your App

```bash
git pull
npm install
cd client && npm install && npm run build && cd ..
pm2 restart chatapp-backend
aws s3 sync client/build/ s3://your-app-frontend --delete
```

Or use the script:
```bash
./scripts/update-app.sh
```

## 📊 Useful Commands

```bash
# View logs
pm2 logs chatapp-backend

# Restart app
pm2 restart chatapp-backend

# Check status
pm2 status

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 💡 Tips

- **Free tier lasts 12 months** from account creation
- **Monitor usage** in AWS Billing Dashboard
- **Set up billing alerts** to avoid surprises
- **Use CloudWatch** for monitoring (free tier available)
- **Backup database** regularly (RDS has automated backups)

## 🆘 Need Help?

See full guide: [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)
