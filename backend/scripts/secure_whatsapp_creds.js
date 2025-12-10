
require('dotenv').config({ path: '../.env' }); // Adjusted for running from backend/scripts
const { Pool } = require('pg');
const { encrypt } = require('../utils/crypto');

// Credentials to secure (Hardcoded here temporarily for the migration)
const API_URL = 'https://ars-evolutionapi.aiiam.com.br';
const API_KEY = '52F4B13969FE-430D-8DDF-AE2078FDA9D2';
const INSTANCE_NAME = 'Atendimento';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateCredentials() {
    try {
        console.log('--- MIGRATING WHATSAPP CREDENTIALS ---');

        // 1. Get Admin User
        const userRes = await pool.query("SELECT id, email FROM users WHERE email LIKE '%@%' ORDER BY id ASC LIMIT 1");
        if (!userRes.rows.length) { console.log('No user found'); process.exit(1); }
        const userId = userRes.rows[0].id;
        console.log(`Target User: ${userRes.rows[0].email} (ID: ${userId})`);

        // 2. Encrypt Token
        const encryptedToken = encrypt(API_KEY);
        console.log('Token Encrypted successfully.');

        // 3. Prepare Config
        const config = {
            url: API_URL,
            instanceName: INSTANCE_NAME,
            instance: INSTANCE_NAME, // Redundancy for old code compat
            baseUrl: API_URL // Redundancy
        };

        // 4. Update or Insert
        // Check existing
        const check = await pool.query(
            "SELECT id FROM integrations WHERE user_id = $1 AND platform = 'evolution_api'",
            [userId]
        );

        if (check.rows.length > 0) {
            console.log('Updating existing integration...');
            await pool.query(
                `UPDATE integrations 
                 SET access_token = $1, config = $2, status = 'connected', updated_at = NOW()
                 WHERE id = $3`,
                [encryptedToken, config, check.rows[0].id]
            );
        } else {
            console.log('Creating new integration...');
            await pool.query(
                `INSERT INTO integrations (user_id, platform, access_token, config, status, created_at, updated_at)
                 VALUES ($1, 'evolution_api', $2, $3, 'connected', NOW(), NOW())`,
                [userId, encryptedToken, config]
            );
        }

        console.log('✅ Credentials secured in Database.');

    } catch (err) {
        console.error('Migration Error:', err);
    } finally {
        process.exit();
    }
}

migrateCredentials();
