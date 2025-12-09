const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');
console.log('Target .env path:', envPath);
console.log('File exists?', fs.existsSync(envPath));

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.log('Dotenv Error:', result.error);
}

console.log('DATABASE_URL defined?', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15));
} else {
    // Try reading file manually to see content
    try {
        const content = fs.readFileSync(envPath, 'utf8');
        console.log('File content preview:', content.substring(0, 50));
    } catch (e) {
        console.log('Error reading file:', e.message);
    }
}
