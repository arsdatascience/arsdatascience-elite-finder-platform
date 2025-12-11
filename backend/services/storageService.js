const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: getS3SignedUrl } = require('@aws-sdk/s3-request-presigner');

// Check if S3 is configured
const isS3Configured = process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY && process.env.S3_BUCKET;

let s3Client;
if (isS3Configured) {
    s3Client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY
        },
        forcePathStyle: true
    });
}

const BUCKET_NAME = process.env.S3_BUCKET;
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads'); // backend/../uploads -> root/uploads

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Upload a file (S3 or Local)
 */
const uploadFile = async (fileBuffer, fileName, mimeType, folder = 'uploads') => {
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;

    if (isS3Configured) {
        const key = `${folder}/${uniqueFileName}`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: 'public-read'
        });

        try {
            await s3Client.send(command);
            const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '');
            return `${endpoint}/${BUCKET_NAME}/${key}`;
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw new Error('Failed to upload file to S3');
        }
    } else {
        // Local Storage Fallback
        const targetDir = path.join(UPLOADS_DIR, folder);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const filePath = path.join(targetDir, uniqueFileName);

        try {
            fs.writeFileSync(filePath, fileBuffer);
            // Construct local URL using FRONTEND_URL or relative path if proxy handles it.
            // Assuming server handles '/uploads' static route mapping to the uploads dir.
            // Server.js line 679: app.use('/uploads', express.static(... 'uploads'))
            // The static path in server.js points to path.join(__dirname, '..', 'uploads') which is backend/../uploads => root/uploads.
            // Matches UPLOADS_DIR.
            // URL format: /uploads/folder/filename
            return `${process.env.API_URL || 'http://localhost:3001'}/uploads/${folder}/${uniqueFileName}`;
        } catch (error) {
            console.error('Error saving to local disk:', error);
            throw new Error('Failed to save file locally');
        }
    }
};

/**
 * Delete a file
 */
const deleteFile = async (fileUrl) => {
    if (isS3Configured && fileUrl.includes(process.env.S3_ENDPOINT)) {
        try {
            const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
            if (urlParts.length < 2) return;
            const key = urlParts[1];
            await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
        } catch (error) {
            console.error('Error deleting from S3:', error);
        }
    } else {
        // Local delete
        try {
            // Extract relative path from URL. URL: http://host/uploads/folder/file.ext
            const urlObj = new URL(fileUrl);
            const relativePath = urlObj.pathname; // /uploads/folder/file.ext
            // Map to filesystem
            // If pathname starts with /uploads, remove it to get internal path inside UPLOADS_DIR
            // Wait, UPLOADS_DIR is root/uploads.
            // So if path is /uploads/foo.jpg, we want root/uploads/foo.jpg

            // Adjust path logic depending on mount point
            let fsPath;
            if (relativePath.startsWith('/uploads')) {
                // Remove /uploads prefix if UPLOADS_DIR already includes 'uploads' at end?
                // UPLOADS_DIR = C:\...\uploads
                // relativePath = /uploads/foo.jpg
                // path.join(root, relativePath) -> root/uploads/foo.jpg
                fsPath = path.join(__dirname, '..', '..', relativePath);
            } else {
                return; // Unknown path
            }

            if (fs.existsSync(fsPath)) {
                fs.unlinkSync(fsPath);
            }
        } catch (error) {
            console.error('Error deleting local file:', error);
        }
    }
};

/**
 * Get a signed URL for file download (works for files with restricted access)
 */
const getSignedUrl = async (fileUrl, expiresIn = 3600) => {
    if (!isS3Configured) {
        // For local files, just return the URL as-is
        return fileUrl;
    }

    try {
        // Extract key from URL
        // URL format: https://endpoint/bucket/key
        const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
        if (urlParts.length < 2) return fileUrl;

        const key = urlParts[1];

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: 'attachment'
        });

        const signedUrl = await getS3SignedUrl(s3Client, command, { expiresIn });
        return signedUrl;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return fileUrl; // Fallback to original URL
    }
};

module.exports = {
    uploadFile,
    deleteFile,
    getSignedUrl
};
