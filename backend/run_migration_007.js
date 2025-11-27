const db = require('./database');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    try {
        const sqlPath = path.join(__dirname, 'migrations', '007_create_chat_analyses.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration 007...');
        await db.query(sql);
        console.log('Migration 007 executed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
};

runMigration();
