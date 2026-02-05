# Fix for Login Redirect Issue on AWS

## Problem
After successful login, the page doesn't redirect to `/chat` properly in production.

## Root Causes

1. **React Router not configured on S3/CloudFront** - All routes must serve `index.html`
2. **API baseURL not set** - Frontend can't reach backend API
3. **Profile API call failing** - AuthContext can't verify user

## Solutions

### 1. Fix S3/CloudFront for React Router

#### For S3 Static Website Hosting:
The bucket should already be configured with `index.html` as index document and error document.

#### For CloudFront:
1. Go to CloudFront Distribution → Error Pages
2. Create Custom Error Response:
   - HTTP Error Code: `403: Forbidden`
   - Response Page Path: `/index.html`
   - HTTP Response Code: `200: OK`
3. Create another for `404: Not Found` with same settings

### 2. Set Environment Variable for API URL

Before building, create `.env.production` in `client/` folder:

```env
REACT_APP_SERVER_URL=https://your-ec2-domain.com
# OR
REACT_APP_SERVER_URL=http://your-ec2-ip
```

Then rebuild:
```bash
cd client
npm run build
```

### 3. Update axiosConfig.js (Already Fixed)

The code now uses `process.env.REACT_APP_SERVER_URL` which should be set.

### 4. Verify Nginx Configuration

Make sure your Nginx config has the API routes:

```nginx
location /api {
    proxy_pass http://localhost:5000;
    # ... other settings
}
```

### 5. Check CORS Settings

In `server/index.js`, make sure CORS allows your frontend domain:

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
```

## Quick Fix Steps

1. **Set environment variable before build:**
   ```bash
   cd client
   echo "REACT_APP_SERVER_URL=https://your-backend-url.com" > .env.production
   npm run build
   ```

2. **Configure CloudFront error pages** (see above)

3. **Upload new build:**
   ```bash
   aws s3 sync client/build/ s3://your-bucket-name --delete
   ```

4. **Invalidate CloudFront cache:**
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

## Testing

1. Open browser console (F12)
2. Try to login
3. Check Network tab for:
   - `/api/auth/login` - should return 200
   - `/api/user/profile` - should return 200 after login
   - Check for CORS errors

## Common Issues

### Issue: "Cannot GET /chat"
**Solution:** CloudFront not configured for React Router. Fix error pages (see above).

### Issue: "Network Error" or CORS error
**Solution:** 
- Check `REACT_APP_SERVER_URL` is set correctly
- Verify backend CORS allows frontend domain
- Check Nginx is proxying `/api` correctly

### Issue: Login works but redirects to login again
**Solution:** 
- Profile API call is failing
- Check backend logs: `pm2 logs chatapp-backend`
- Verify token is being sent in Authorization header

### Issue: Blank page after login
**Solution:**
- Check browser console for JavaScript errors
- Verify all files uploaded to S3 correctly
- Check CloudFront distribution status

## Verification Checklist

- [ ] CloudFront error pages configured (403 → index.html, 404 → index.html)
- [ ] `REACT_APP_SERVER_URL` set in `.env.production`
- [ ] Frontend rebuilt with correct API URL
- [ ] New build uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] Backend CORS allows frontend domain
- [ ] Nginx proxying `/api` and `/socket.io` correctly
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls
