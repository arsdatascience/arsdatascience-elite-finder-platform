require('dotenv').config();
const db = require('./db');

async function checkConstraint() {
    try {
        console.log('Checking users_status_check constraint...');
        const result = await db.query(`
            SELECT pg_get_constraintdef(oid) AS constraint_def
            FROM pg_constraint
            WHERE conname = 'users_status_check';
        `);

        if (result.rows.length > 0) {
            console.log('Constraint Definition:', result.rows[0].constraint_def);
        } else {
            console.log('Constraint not found!');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

checkConstraint();
