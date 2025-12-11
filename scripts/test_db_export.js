// Quick test to verify opsPool export pattern
require('dotenv').config({ path: __dirname + '/../backend/.env' });
const db = require('../backend/database');

console.log('=== Database Export Test ===');
console.log('Type of export:', typeof db);
console.log('Has opsPool property?', db.hasOwnProperty('opsPool'));
console.log('opsPool is:', db.opsPool ? 'defined' : 'undefined');

// Test destructuring pattern
const { opsPool: testPool } = db;
console.log('Destructured opsPool:', testPool ? 'defined' : 'undefined');

// Try to query
if (testPool) {
    testPool.query('SELECT COUNT(*) as count FROM templates WHERE is_active = true')
        .then(res => {
            console.log('✅ Query result:', res.rows[0].count, 'active templates');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Query error:', err.message);
            process.exit(1);
        });
} else {
    console.error('❌ testPool is undefined!');
    process.exit(1);
}
