require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const updateSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('Iniciando atualização do schema...');
        await client.query('BEGIN');

        // Atualizar tabela clients
        console.log('Atualizando tabela clients...');
        await client.query(`
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS document VARCHAR(20);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS foundation_date DATE;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_state CHAR(2);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_url TEXT;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS facebook_url TEXT;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS website TEXT;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
        `);

        // Atualizar tabela tenants
        console.log('Atualizando tabela tenants...');
        await client.query(`
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cnpj VARCHAR(20);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email VARCHAR(255);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_district VARCHAR(100);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_state CHAR(2);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10);
        `);

        await client.query('COMMIT');
        console.log('Schema atualizado com sucesso!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao atualizar schema:', error);
    } finally {
        client.release();
        pool.end();
    }
};

updateSchema();
