// Database connection configuration
const { Pool } = require('pg');

const isRailway = (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('rlwy.net')) ||
    (process.env.DATA_BASE_URL2 && process.env.DATA_BASE_URL2.includes('rlwy.net'));

const sslConfig = (process.env.NODE_ENV === 'production' || isRailway) ? { rejectUnauthorized: false } : false;

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig
});

// Create Operations connection pool (New Modules: Projects, Tasks, SOPs, Finance)
// Railway uses DATA_BASE_URL2 for Maglev (Operations DB)
const opsPool = new Pool({
    connectionString: process.env.DATA_BASE_URL2 || process.env.OPERATIONS_DB_URL || process.env.DATABASE_URL,
    ssl: sslConfig
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('⚠️  Unexpected CORE database error:', err.message);
});

opsPool.on('error', (err) => {
    console.error('⚠️  Unexpected OPS database error:', err.message);
});

// Attach opsPool to pool for backward compatibility and destructuring
pool.opsPool = opsPool;
pool.pool = pool; // Allow const { pool } = require... as well

// Export the pool (Core) as default, with opsPool attached
module.exports = pool;
