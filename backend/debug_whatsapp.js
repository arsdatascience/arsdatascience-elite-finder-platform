
require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');
const axios = require('axios');
// const { decrypt } = require('../backend/utils/crypto'); 
const decrypt = (str) => str; // Mock decrypt


// Mock decrypt if not available in this context (requires secret)
// Assuming we can just test the ENV fallback first which is likely the issue if DB is empty
// Or we can query DB.

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testSend() {
    try {
        console.log('--- TEST SEND WHATSAPP ---');

        // 1. Get User
        const userRes = await pool.query("SELECT id, email FROM users WHERE email LIKE '%@%' LIMIT 1");
        if (!userRes.rows.length) { console.log('No user found'); process.exit(); }
        const userId = userRes.rows[0].id;
        console.log(`User ID: ${userId}`);

        // 2. Simulate Service Logic
        const result = await pool.query(
            `SELECT platform, access_token, config FROM integrations 
             WHERE user_id = $1 AND platform IN ('whatsapp', 'evolution_api') AND status = 'connected'
             LIMIT 1`,
            [userId]
        );

        let config = {};
        let accessToken = '';

        if (result.rows.length === 0) {
            console.log('No DB Integration found. Checking ENV...');
            console.log('EVOLUTION_API_URL present:', !!process.env.EVOLUTION_API_URL);
            console.log('EVOLUTION_API_KEY present:', !!process.env.EVOLUTION_API_KEY);
            console.log('EVOLUTION_INSTANCE_NAME present:', !!process.env.EVOLUTION_INSTANCE_NAME);

            if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
                config = { url: process.env.EVOLUTION_API_URL, instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'Atendimento' };
                accessToken = process.env.EVOLUTION_API_KEY;
            } else {
                console.log('Trying fallback with credentials from logs...');
                // Credentials from User Logs (Step 10977)
                config = {
                    url: 'https://ars-evolutionapi.aiiam.com.br',
                    instanceName: 'Atendimento'
                };
                accessToken = '52F4B13969FE-430D-8DDF-AE2078FDA9D2';
            }
        } else {
            console.log('Found DB Integration.');
            config = result.rows[0].config;
            // skipping decrypt for now, just logging content
            console.log('Config:', config);
        }

        // 3. Test API Call
        const baseUrl = config.baseUrl || config.url;
        const instanceName = config.instanceName || config.instance;
        const apiKey = accessToken || config.apiKey;

        console.log(`Testing with -> URL: ${baseUrl}, Instance: ${instanceName}, Key: ${apiKey ? '***' : 'MISSING'}`);

        if (!baseUrl || !instanceName || !apiKey) {
            console.error('Missing config params');
            process.exit(1);
        }

        // Check health/connection first
        try {
            const healthUrl = `${baseUrl.replace(/\/$/, '')}/instance/fetchInstances`;
            console.log(`Checking connection to: ${healthUrl}`);
            const health = await axios.get(healthUrl, { headers: { 'apikey': apiKey } });
            console.log('Instances found:', health.data.length || health.data);

            // Check specific instance
            const specificInstance = health.data.find(i => i.instance.instanceName === instanceName);
            if (specificInstance) {
                console.log(`Instance ${instanceName} Status:`, specificInstance.instance.status);
            } else {
                console.warn(`Instance ${instanceName} NOT FOUND in list!`);
            }

        } catch (e) {
            console.error('Connection Check Failed:', e.message);
            if (e.response) console.error('Data:', e.response.data);
        }

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        process.exit();
    }
}

testSend();
