const path = require('path');
// Try loading from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// MOCK ENV VARS TO FORCE S3 MODE IN SERVICE
process.env.S3_ACCESS_KEY = 'mock';
process.env.S3_SECRET_KEY = 'mock';
process.env.S3_BUCKET = 'mock';
process.env.S3_ENDPOINT = 'https://storage.railway.app';

// MOCK SPECIFIC TENANT 1 VARS (to avoid relying on hardcoded fallbacks in test)
process.env.S3_ELITE_FINDER_BUCKET = 'bucket-elite-finder-9-zcci';
process.env.S3_ELITE_FINDER_ACCESS_KEY = 'tid_IMMVHgdvyQpkvrqGWGGuVZvnhohRHaPhzMgZtIrUTvmrgCMGQU';
process.env.S3_ELITE_FINDER_SECRET_KEY = 'tsec_cSJ3BOMLOLeVR1Fi-zD-kQWdHMWPJTuX+ll+9erWLjLelVDnJlIOUCz-vN7YuugMw0c04F';

const { uploadFile } = require('../services/storageService');

async function testUpload() {
    console.log('🚀 Starting S3 Upload Test for Tenant 1...');
    console.log('DEBUG: S3_ENDPOINT set to:', process.env.S3_ENDPOINT);

    const sampleData = Buffer.from('This is a test file for Elite Finder Tenant 1 S3 Bucket.');
    const fileName = `test-upload-tenant1-${Date.now()}.txt`;
    const mimeType = 'text/plain';
    const tenantId = 1;

    try {
        console.log(`Uploading ${fileName} to Tenant 1 Bucket...`);
        const resultUrl = await uploadFile(sampleData, fileName, mimeType, 'tests', tenantId);

        console.log('✅ Upload Successful!');
        console.log('📂 File URL:', resultUrl);

        if (resultUrl.includes('bucket-elite-finder-9-zcci')) {
            console.log('🎉 SUCCESS: URL confirms correct bucket usage!');
        } else {
            console.error('⚠️ WARNING: URL does NOT contain expected bucket name.');
            console.log('Expected: bucket-elite-finder-9-zcci');
            console.log('Received:', resultUrl);
        }

    } catch (error) {
        console.error('❌ Upload Failed:', error);
        if (error.message.includes('S3')) {
            console.error('Check endpoint and credentials.');
        }
    }
}

testUpload();
