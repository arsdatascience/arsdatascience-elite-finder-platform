const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const db = require('../backend/database');

async function seedUUID() {
    try {
        console.log('🌱 Seeding WhatsApp Instance UUID...');

        // This UUID comes from the user's URL: 
        // https://ars-evolutionapi.aiiam.com.br/manager/instance/4e062cf0-cb36-4669-8652-5729b036549e/chat/...
        const instanceName = '4e062cf0-cb36-4669-8652-5729b036549e';
        const tenantId = 1;

        // Check if exists
        const check = await db.query('SELECT * FROM whatsapp_instances WHERE instance_name = $1', [instanceName]);
        if (check.rows.length > 0) {
            console.log('⚠️ Instance UUID already exists.');
        } else {
            await db.query(`
                INSERT INTO whatsapp_instances (instance_name, tenant_id, api_url, status)
                VALUES ($1, $2, 'https://ars-evolutionapi.aiiam.com.br', 'connected')
            `, [instanceName, tenantId]);
            console.log(`✅ Instance "${instanceName}" created successfully.`);
        }

    } catch (err) {
        console.error('❌ Error seeding:', err);
    } finally {
        process.exit();
    }
}

seedUUID();
