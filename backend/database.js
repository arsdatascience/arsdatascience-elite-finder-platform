// Database connection configuration
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('⚠️  Unexpected database error:', err.message);
});

// Export the pool for use in controllers
module.exports = pool;
