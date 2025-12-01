require('dotenv').config({ path: './backend/.env' });
const db = require('../db');

const checkSchema = async () => {
    console.log('Checking schema...');
    try {
        // Verificar colunas de clients
        const res = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'clients';
        `);
        console.log('Columns in clients table:', res.rows.map(r => r.column_name));

        // Se não tiver tenant_id, adicionar
        if (!res.rows.find(r => r.column_name === 'tenant_id')) {
            console.log('Adding tenant_id to clients...');
            await db.query('ALTER TABLE clients ADD COLUMN tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE');
            console.log('Added tenant_id.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
};

checkSchema();
