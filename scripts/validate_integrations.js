const { Pool } = require('pg');
// Try to require from backend node_modules if not found in root
let Redis;
try {
    Redis = require('ioredis');
} catch (e) {
    Redis = require('../backend/node_modules/ioredis');
}
const axios = require('axios');
const path = require('path');
// Load env from backend/.env if root/.env fails or we want specific consistency
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function validateIntegrations() {
    console.log('🔍 Starting System Integration Validation...\n');
    let errors = [];

    // 1. Validate PostgreSQL Connection
    console.log('----------------------------------------');
    console.log('🐘 Testing PostgreSQL Connection...');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW() as now');
        console.log('✅ PostgreSQL Connected Successfully!');
        console.log(`   Timestamp: ${res.rows[0].now}`);
        client.release();
    } catch (err) {
        console.error('❌ PostgreSQL Connection Failed:', err.message);
        errors.push('PostgreSQL');
    }
    await pool.end();

    // 2. Validate Redis Connection
    console.log('\n----------------------------------------');
    console.log('🔴 Testing Redis Connection...');

    // Logic similar to redisClient.js
    let redisUrl = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL;
    let redis;

    if (redisUrl) {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            retryStrategy: () => null // Don't retry indefinitely for this test
        });
    } else {
        redis = new Redis({
            host: process.env.REDISHOST || 'localhost',
            port: process.env.REDISPORT || 6379,
            password: process.env.REDISPASSWORD,
            username: process.env.REDISUSER,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null
        });
    }

    try {
        await redis.set('integration_test', 'success', 'EX', 10);
        const value = await redis.get('integration_test');
        if (value === 'success') {
            console.log('✅ Redis Connected & Writing Successfully!');
            const info = await redis.info();
            const version = info.match(/redis_version:([0-9.]+)/)?.[1];
            console.log(`   Redis Version: ${version}`);
        } else {
            throw new Error('Read/Write mismatch');
        }
    } catch (err) {
        console.error('❌ Redis Connection Failed:', err.message);
        errors.push('Redis');
    } finally {
        if (redis) redis.disconnect();
    }

    // 3. Validate Qdrant Connection
    console.log('\n----------------------------------------');
    console.log('🟣 Testing Qdrant Connection...');
    const qdrantUrl = process.env.QDRANT_URL;
    const qdrantKey = process.env.QDRANT_API_KEY;

    if (!qdrantUrl) {
        console.log('⚠️  QDRANT_URL not defined in .env');
        errors.push('Qdrant Configuration');
    } else {
        try {
            // Normalize URL
            const baseUrl = qdrantUrl.replace(/\/$/, '');
            const headers = qdrantKey ? { 'api-key': qdrantKey } : {};

            const response = await axios.get(`${baseUrl}/collections`, { headers, timeout: 5000 });

            if (response.status === 200) {
                console.log('✅ Qdrant Connected Successfully!');
                console.log(`   Collections found: ${response.data.result.collections.length}`);
                response.data.result.collections.forEach(c => console.log(`   - ${c.name}`));
            } else {
                throw new Error(`Status ${response.status}`);
            }
        } catch (err) {
            console.error('❌ Qdrant Connection Failed:', err.message);
            // Try to give a hint
            if (err.code === 'ECONNREFUSED') console.log('   Hint: Is Qdrant running locally or is the URL correct?');
            errors.push('Qdrant');
        }
    }

    // Summary
    console.log('\n========================================');
    if (errors.length === 0) {
        console.log('🚀 ALL SYSTEMS GO! Integrations are verified.');
    } else {
        console.error(`⚠️  VALIDATION FAILED for: ${errors.join(', ')}`);
        process.exit(1);
    }
}

validateIntegrations();
