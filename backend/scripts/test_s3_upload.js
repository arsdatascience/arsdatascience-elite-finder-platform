require('dotenv').config({ path: '../.env' }); // Adjust path if running from scripts dir
const storageService = require('../services/storageService');

async function testUpload() {
    console.log('Starting S3 Upload Test...');
    console.log('Region:', process.env.S3_REGION);
    console.log('Bucket:', process.env.S3_BUCKET);
    console.log('Endpoint:', process.env.S3_ENDPOINT);

    const fileContent = Buffer.from('Hello S3 from Elite Finder Test Script ' + new Date().toISOString());
    const fileName = 'test_upload.txt';
    const mimeType = 'text/plain';

    try {
        console.log('Attempting upload...');
        const url = await storageService.uploadFile(fileContent, fileName, mimeType, 'tests');
        console.log('Upload Successful!');
        console.log('File URL:', url);
    } catch (error) {
        console.error('Upload Failed:', error);
    }
}

testUpload();
