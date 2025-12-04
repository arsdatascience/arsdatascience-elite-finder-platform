const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3Client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    },
    forcePathStyle: true // Required for some S3-compatible services
});

const BUCKET_NAME = process.env.S3_BUCKET;

/**
 * Upload a file to S3
 * @param {Buffer} fileBuffer - The file content
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} folder - Optional folder path (e.g., 'avatars', 'posts')
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadFile = async (fileBuffer, fileName, mimeType, folder = 'uploads') => {
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${crypto.randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'public-read' // Ensure the file is publicly accessible
    });

    try {
        await s3Client.send(command);
        // Construct the public URL
        // For Railway S3, it's usually endpoint/bucket/key or similar depending on config
        // But typically we can use the endpoint + bucket + key
        // Let's assume standard path style: https://storage.railway.app/bucket-name/key
        // Or if endpoint includes bucket, just endpoint/key.
        // Based on Railway docs, it's usually: https://<project-id>.up.railway.app/<bucket>/<key>
        // But the user provided https://storage.railway.app as endpoint.

        // Let's construct a generic URL. If the endpoint is the gateway, we append bucket/key.
        const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '');
        return `${endpoint}/${BUCKET_NAME}/${uniqueFileName}`;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to storage');
    }
};

/**
 * Delete a file from S3
 * @param {string} fileUrl - The full URL of the file to delete
 */
const deleteFile = async (fileUrl) => {
    try {
        // Extract key from URL
        // URL: https://endpoint/bucket/folder/file.ext
        const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
        if (urlParts.length < 2) return; // Invalid URL or not in this bucket

        const key = urlParts[1];

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        await s3Client.send(command);
    } catch (error) {
        console.error('Error deleting from S3:', error);
        // Don't throw, just log. Deletion failure shouldn't block main flow.
    }
};

module.exports = {
    uploadFile,
    deleteFile
};
