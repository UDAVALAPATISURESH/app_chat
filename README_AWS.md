# AWS Free Tier Deployment - Complete Guide

This project is ready to deploy on AWS using **100% free tier services** for the first 12 months.

## 📚 Documentation Files

1. **[AWS_QUICK_START.md](./AWS_QUICK_START.md)** - Fast step-by-step deployment (15 minutes)
2. **[AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)** - Comprehensive detailed guide
3. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - General deployment options

## 🆓 Free Tier Services

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| EC2 t2.micro | 750 hrs/month (12 months) | ~$8-10/month |
| RDS db.t2.micro | 750 hrs/month (12 months) | ~$15/month |
| S3 | 5 GB storage (forever) | ~$0.023/GB |
| CloudFront | 50 GB transfer (forever) | ~$0.085/GB |
| Data Transfer | 1 GB/month (forever) | Pay per GB |

**Total Cost:** $0/month for first 12 months, then ~$25-30/month

## 🏗️ Architecture

```
┌─────────────────┐
│   CloudFront    │  ← Frontend (React App)
│   (CDN)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   S3 Bucket     │  ← Static Files
└─────────────────┘

┌─────────────────┐
│   EC2 Instance  │  ← Backend (Node.js + Express)
│   (t2.micro)    │
│   + Nginx       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   RDS MySQL     │  ← Database
│   (db.t2.micro) │
└─────────────────┘

┌─────────────────┐
│   S3 Bucket     │  ← Media Storage
│   (Media Files) │
└─────────────────┘
```

## 🚀 Quick Start

### Option 1: Automated (Recommended)

1. **Launch EC2 instance** (t2.micro, Amazon Linux 2023)
2. **Connect via SSH**
3. **Run setup script:**
   ```bash
   ./scripts/setup-ec2.sh
   ```
4. **Follow [AWS_QUICK_START.md](./AWS_QUICK_START.md)** for remaining steps

### Option 2: Manual

Follow the detailed guide in **[AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)**

## 📋 Prerequisites

- AWS Account (free to create)
- Domain name (optional - can use EC2 IP)
- Basic Linux knowledge
- Git repository access

## 🔧 Configuration Files

- `ecosystem.config.js` - PM2 configuration
- `nginx.conf.example` - Nginx reverse proxy config
- `scripts/deploy.sh` - Deployment automation
- `scripts/setup-ec2.sh` - EC2 setup automation
- `scripts/update-app.sh` - Update automation

## 📝 Environment Variables

Create `.env` file on EC2 with:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-cloudfront-url.cloudfront.net

MYSQL_HOST=your-rds-endpoint.amazonaws.com
MYSQL_USER=admin
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=chatapp

JWT_SECRET=generate-with-crypto-randomBytes-32

AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket

GEMINI_API_KEY=your-key
```

## 🔄 Deployment Workflow

1. **Initial Setup:**
   ```bash
   ./scripts/setup-ec2.sh
   ```

2. **Deploy:**
   ```bash
   ./scripts/deploy.sh
   ```

3. **Update:**
   ```bash
   ./scripts/update-app.sh
   ```

## 🛠️ Useful Commands

```bash
# PM2 Process Management
pm2 start ecosystem.config.js
pm2 logs chatapp-backend
pm2 restart chatapp-backend
pm2 status

# Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log

# Database
mysql -h your-rds-endpoint -u admin -p

# S3 Upload
aws s3 sync client/build/ s3://your-bucket --delete
```

## 🔐 Security Checklist

- [ ] Strong JWT_SECRET (32+ characters)
- [ ] Secure MySQL password
- [ ] AWS IAM user with minimal permissions
- [ ] Security groups configured correctly
- [ ] HTTPS enabled (CloudFront or Let's Encrypt)
- [ ] Environment variables secured
- [ ] Regular backups configured

## 📊 Monitoring

- **PM2:** `pm2 monit`
- **CloudWatch:** Free tier includes basic monitoring
- **Nginx Logs:** `/var/log/nginx/`
- **Application Logs:** `pm2 logs`

## 🐛 Troubleshooting

### Backend not starting?
```bash
pm2 logs chatapp-backend
# Check for errors
```

### Database connection failed?
- Verify RDS security group allows EC2 access
- Check MySQL credentials in `.env`
- Test connection: `mysql -h endpoint -u user -p`

### Frontend not loading?
- Check S3 bucket permissions
- Verify CloudFront distribution status
- Check browser console for errors

### Socket.IO not connecting?
- Verify Nginx `/socket.io` location block
- Check CORS settings
- Verify WebSocket upgrade headers

## 💰 Cost Optimization Tips

1. **Use free tier services** for first 12 months
2. **Stop EC2/RDS** when not in use (saves hours)
3. **Use S3 lifecycle policies** to delete old files
4. **Monitor CloudWatch** for unexpected usage
5. **Set up billing alerts** in AWS Console

## 📚 Additional Resources

- [AWS Free Tier](https://aws.amazon.com/free/)
- [EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [RDS Documentation](https://docs.aws.amazon.com/rds/)
- [S3 Documentation](https://docs.aws.amazon.com/s3/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review AWS_DEPLOYMENT.md for detailed steps
3. Check AWS CloudWatch logs
4. Verify all environment variables are set correctly

## ✅ Deployment Checklist

- [ ] EC2 instance launched
- [ ] RDS database created
- [ ] Security groups configured
- [ ] Environment variables set
- [ ] Backend running with PM2
- [ ] Nginx configured
- [ ] Frontend built and uploaded to S3
- [ ] CloudFront distribution created
- [ ] SSL certificate configured (optional)
- [ ] Domain configured (optional)
- [ ] All features tested

---

**Ready to deploy?** Start with [AWS_QUICK_START.md](./AWS_QUICK_START.md)!
