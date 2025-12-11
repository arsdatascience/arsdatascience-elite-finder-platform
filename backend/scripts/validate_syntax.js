const fs = require('fs');
const path = require('path');

const filesToTest = [
    '../server.js',
    '../whatsappController.js',
    '../aiController.js',
    '../services/jobProcessor.js',
    '../services/whatsappService.js',
    '../churnController.js'
];

console.log('🔍 Validating syntax of core files...');

filesToTest.forEach(file => {
    try {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            require(filePath);
            console.log(`✅ ${file} loaded successfully.`);
        } else {
            console.warn(`⚠️ File not found: ${file}`);
        }
    } catch (error) {
        console.error(`❌ Error loading ${file}:`);
        console.error(error);
    }
});

console.log('🏁 Validation complete.');
