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

// Tenant 1 Exclusive Config
const TENANT_1_CONFIG = {
    BUCKET: process.env.S3_ELITE_FINDER_BUCKET || 'bucket-elite-finder-9-zcci',
    ACCESS_KEY: process.env.S3_ELITE_FINDER_ACCESS_KEY || 'tid_IMMVHgdvyQpkvrqGWGGuVZvnhohRHaPhzMgZtIrUTvmrgCMGQU',
    SECRET_KEY: process.env.S3_ELITE_FINDER_SECRET_KEY || 'tsec_cSJ3BOMLOLeVR1Fi-zD-kQWdHMWPJTuX+ll+9erWLjLelVDnJlIOUCz-vN7YuugMw0c04F',
    ENDPOINT: 'https://storage.railway.app'
};

let tenant1S3Client;
try {
    tenant1S3Client = new S3Client({
        region: 'auto',
        endpoint: TENANT_1_CONFIG.ENDPOINT,
        credentials: {
            accessKeyId: TENANT_1_CONFIG.ACCESS_KEY,
            secretAccessKey: TENANT_1_CONFIG.SECRET_KEY
        },
        forcePathStyle: true
    });
} catch (err) {
    console.error('Failed to initialize Tenant 1 S3 Client:', err);
}

/**
 * Helper to get Client and Bucket based on Tenant ID
 */
const getStorageContext = (tenantId) => {
    // Check if tenantId matches Tenant 1 (Assuming ID is 1 or string '1')
    if (tenantId && String(tenantId) === '1' && tenant1S3Client) {
        return {
            client: tenant1S3Client,
            bucket: TENANT_1_CONFIG.BUCKET
        };
    }
    // Default to main configuration
    return {
        client: s3Client,
        bucket: BUCKET_NAME
    };
};

/**
 * Upload a file (S3 or Local)
 */
const uploadFile = async (fileBuffer, fileName, mimeType, folder = 'uploads', tenantId = null, bucketOverride = null) => {
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;

    // Check if we have S3 configured at all
    if (isS3Configured) {
        let { client, bucket } = getStorageContext(tenantId);

        if (bucketOverride) {
            bucket = bucketOverride;
        }

        // If specific tenant client failed to init but main exists, or vice versa needs handling?
        // Current logic: if tenant1S3Client exists, use it. If not (endpoint missing?), fall back or fail?
        // Assuming process.env.S3_ENDPOINT is set since isS3Configured is true.

        const key = `${folder}/${uniqueFileName}`;
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: 'public-read'
        });

        try {
            await client.send(command);

            // Determine endpoint to use for URL
            let endpoint = process.env.S3_ENDPOINT || '';
            if (tenantId && String(tenantId) === '1') {
                endpoint = TENANT_1_CONFIG.ENDPOINT;
            }
            endpoint = endpoint.replace(/\/$/, '');

            // Return URL with correct bucket
            return `${endpoint}/${bucket}/${key}`;
        } catch (error) {
            console.error(`Error uploading to S3 (Tenant ${tenantId}):`, error);
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
const deleteFile = async (fileUrl, tenantId = null) => {
    if (isS3Configured && fileUrl.includes(process.env.S3_ENDPOINT)) {
        try {
            const { client, bucket } = getStorageContext(tenantId);
            const urlParts = fileUrl.split(`${bucket}/`);
            if (urlParts.length < 2) return; // URL doesn't match bucket pattern

            const key = urlParts[1];
            await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        } catch (error) {
            console.error('Error deleting from S3:', error);
        }
    } else {
        // Local delete logic remains same
        try {
            const urlObj = new URL(fileUrl);
            const relativePath = urlObj.pathname;
            let fsPath;
            if (relativePath.startsWith('/uploads')) {
                fsPath = path.join(__dirname, '..', '..', relativePath);
            } else {
                return;
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
 * Get a signed URL for file download
 */
const getSignedUrl = async (fileUrl, expiresIn = 3600, tenantId = null) => {
    if (!isS3Configured) {
        return fileUrl;
    }

    try {
        const { client, bucket } = getStorageContext(tenantId);
        const urlParts = fileUrl.split(`${bucket}/`);
        if (urlParts.length < 2) return fileUrl;

        const key = urlParts[1];

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: 'attachment'
        });

        const signedUrl = await getS3SignedUrl(client, command, { expiresIn });
        return signedUrl;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return fileUrl;
    }
};

module.exports = {
    uploadFile,
    deleteFile,
    getSignedUrl
};
