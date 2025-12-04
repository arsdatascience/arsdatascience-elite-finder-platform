const fs = require('fs');
const path = require('path');

const filesToTest = [
    '../whatsappController.js',
    '../aiController.js',
    '../services/jobProcessor.js',
    '../services/whatsappService.js',
    '../churnController.js'
];

console.log('🔍 Validating syntax of controllers (skipping server.js)...');

filesToTest.forEach(file => {
    try {
        const filePath = path.join(__dirname, file);
        console.log(`Testing ${file}...`);
        if (fs.existsSync(filePath)) {
            require(filePath);
            console.log(`✅ ${file} loaded successfully.`);
        } else {
            console.warn(`⚠️ File not found: ${file}`);
        }
    } catch (error) {
        console.error(`❌ Error loading ${file}:`);
        console.error(error.message);
        // console.error(error); // Full stack trace if needed
    }
});

console.log('🏁 Validation complete.');
