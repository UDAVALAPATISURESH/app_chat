/**
 * Media Upload Routes
 * Handles file uploads to AWS S3 for images, videos, and documents
 * Files are stored in S3 and URLs are returned for use in chat messages
 */

const express = require('express');
const multer = require('multer');      // Middleware for handling file uploads
const AWS = require('aws-sdk');         // AWS SDK for S3 operations
const authenticate = require('../middleware/auth');  // Authentication middleware

const router = express.Router();

// ========== AWS S3 CONFIGURATION ==========
// Initialize S3 client with credentials from environment variables
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,        // AWS access key
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // AWS secret key
  region: process.env.AWS_REGION || 'us-east-1'      // AWS region (default: us-east-1)
});

// ========== MULTER CONFIGURATION ==========
// Configure multer to store files in memory (not on disk)
// This is more efficient for uploading directly to S3
const upload = multer({
  storage: multer.memoryStorage(),  // Store file in memory as buffer
  limits: {
    fileSize: 10 * 1024 * 1024     // Maximum file size: 10MB
  }
});

/**
 * POST /api/media/upload
 * Upload a file to AWS S3
 * 
 * Process:
 * 1. Authenticate user (middleware)
 * 2. Receive file via multer
 * 3. Generate unique filename
 * 4. Determine file type (image/video/file)
 * 5. Upload to S3
 * 6. Return public URL
 */
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    // ========== VALIDATE FILE ==========
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    
    // ========== CHECK AWS CONFIGURATION ==========
    // If AWS is not configured, return error with helpful message
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      console.warn('AWS S3 not configured. File uploads are disabled.');
      return res.status(503).json({ 
        error: 'File upload service is not configured. Please configure AWS S3 credentials in .env file.',
        details: 'AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME are required'
      });
    }
    
    // ========== GENERATE UNIQUE FILENAME ==========
    // Extract file extension from original filename
    const fileExtension = file.originalname.split('.').pop();
    
    // Create unique filename: timestamp + random string + extension
    // This prevents filename conflicts
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
    // ========== DETERMINE FILE TYPE ==========
    // Check MIME type to categorize file
    const fileType = file.mimetype.startsWith('image/') ? 'image' : 
                     file.mimetype.startsWith('video/') ? 'video' : 'file';

    // ========== S3 UPLOAD PARAMETERS ==========
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,  // S3 bucket name
      Key: fileName,                           // File name in S3
      Body: file.buffer,                       // File content (from memory)
      ContentType: file.mimetype,              // MIME type (e.g., image/jpeg)
      ACL: 'public-read'                       // Make file publicly accessible
    };

    // ========== UPLOAD TO S3 ==========
    // Upload file to S3 and get result
    const result = await s3.upload(params).promise();

    // ========== RETURN SUCCESS RESPONSE ==========
    // Return public URL and file metadata
    res.json({
      message: 'File uploaded successfully',
      url: result.Location,        // Public URL of uploaded file
      type: fileType,              // File type: 'image', 'video', or 'file'
      fileName: file.originalname  // Original filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    if (error.code === 'CredentialsError') {
      return res.status(500).json({ error: 'AWS credentials are invalid' });
    } else if (error.code === 'NoSuchBucket') {
      return res.status(500).json({ error: 'AWS S3 bucket does not exist' });
    } else {
      return res.status(500).json({ error: 'Failed to upload file', details: error.message });
    }
  }
});

module.exports = router;
