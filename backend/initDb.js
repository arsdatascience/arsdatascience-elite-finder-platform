const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initializeDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🔄 Checking database schema...');

        // Read schema.sql file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await pool.query(schema);

        console.log('✅ Database schema initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        // Don't crash the app if DB init fails
    } finally {
        await pool.end();
    }
}

module.exports = { initializeDatabase };
