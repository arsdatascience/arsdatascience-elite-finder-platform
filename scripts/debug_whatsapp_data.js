const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const db = require('../backend/database');

async function debugData() {
    try {
        console.log('--- WhatsApp Instances ---');
        const instances = await db.query('SELECT * FROM whatsapp_instances');
        console.table(instances.rows);

        console.log('\n--- Recent Clients ---');
        const clients = await db.query('SELECT * FROM clients ORDER BY created_at DESC LIMIT 5');
        console.table(clients.rows);

        console.log('\n--- Chat Sessions ---');
        const sessions = await db.query('SELECT * FROM chat_sessions ORDER BY created_at DESC LIMIT 5');
        console.table(sessions.rows);

        console.log('\n--- Recent Messages ---');
        const messages = await db.query('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 5');
        console.table(messages.rows);

    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        process.exit();
    }
}

debugData();
