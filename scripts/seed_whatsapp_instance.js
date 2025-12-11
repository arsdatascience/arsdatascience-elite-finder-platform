const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const db = require('../backend/database');

async function seed() {
    try {
        console.log('🌱 Seeding WhatsApp Instance...');

        const instanceName = 'Atendimento';
        const tenantId = 1; // Default
        const apiUrl = 'https://ars-evolutionapi.aiiam.com.br/';
        const apiKey = ''; // User didn't provide full key, leaving empty for now

        // Check if exists
        const check = await db.query('SELECT * FROM whatsapp_instances WHERE instance_name = $1', [instanceName]);
        if (check.rows.length > 0) {
            console.log('⚠️ Instance already exists.');
        } else {
            await db.query(`
                INSERT INTO whatsapp_instances (instance_name, tenant_id, api_url, api_key, status)
                VALUES ($1, $2, $3, $4, 'connected')
            `, [instanceName, tenantId, apiUrl, apiKey]);
            console.log(`✅ Instance "${instanceName}" created successfully.`);
        }

    } catch (err) {
        console.error('❌ Error seeding:', err);
    } finally {
        process.exit();
    }
}

seed();
