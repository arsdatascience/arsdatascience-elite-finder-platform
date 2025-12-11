const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Absolute path resolution

console.log('Current directory:', __dirname);
console.log('Resolved env path:', path.join(__dirname, '../.env'));
console.log('DATABASE_URL defined?', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    console.log('DATABASE_URL starts with:', url.substring(0, 15) + '...');
} else {
    console.log('DATABASE_URL is MISSING or empty.');
}
