// Database connection configuration
const { Pool } = require('pg');

// Debug: Log which env vars are available
const opsConnectionString = process.env.DATA_BASE_URL2 || process.env.OPERATIONS_DB_URL || process.env.DATABASE_URL;
console.log('🔌 DB Config:', {
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    DATA_BASE_URL2: process.env.DATA_BASE_URL2 ? '✅ Set' : '❌ Missing',
    OPERATIONS_DB_URL: process.env.OPERATIONS_DB_URL ? '✅ Set' : '❌ Missing',
    opsPoolUsing: opsConnectionString ? opsConnectionString.substring(0, 30) + '...' : 'NONE'
});

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create Operations connection pool (New Modules: Projects, Tasks, SOPs, Finance)
// Railway uses DATA_BASE_URL2 for Maglev (Operations DB)
const opsPool = new Pool({
    connectionString: opsConnectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
