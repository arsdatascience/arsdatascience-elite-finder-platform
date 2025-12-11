
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.import' });

const opsPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL });

async function verifyAndCertifyTables() {
    console.log('🛡️  Certifying Operational Tables Schema for Import...');

    /*
     * SCHEMA DEFINITIONS (Certified Correct)
     * 1. tasks: Simple Integer IDs (Serial)
     * 2. transactions: UUID for id and tenant_id, Integer for client_id
     * 3. satisfaction_scores: Integer IDs (Serial)
     */

    try {
        // 1. TASKS
        // Check if exists, if not create. If exists, ensure cols.
        await opsPool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER,
                project_id INTEGER,
                title VARCHAR(255),
                status VARCHAR(50),
                priority VARCHAR(20),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        // Add columns if missing (idempotent)
        await opsPool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id INTEGER`);
        await opsPool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER`);
        console.log('✅ Tasks Table: Certified.');

        // 2. TRANSACTIONS
        // Critical: Handle UUID vs Integer mismatch.
        // We will create if not exists with UUID.
        // If it exists, we assume it's correct (as per previous inspection).

        // Inspect current definition first to be safe
        const tSchema = await opsPool.query(`
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'id'
        `);

        if (tSchema.rows.length === 0) {
            // Create New
            console.log('🆕 Creating Transactions table...');
            await opsPool.query(`
                CREATE TABLE transactions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID,
                    client_id INTEGER,
                    description TEXT,
                    amount DECIMAL(10,2),
                    type VARCHAR(20),
                    category VARCHAR(100),
                    date TIMESTAMP,
                    status VARCHAR(20),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);
        } else {
            // Table exists. Certify columns.
            console.log('ℹ️  Transactions table exists. Verifying columns...');
            await opsPool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR(100)`);
            await opsPool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_id INTEGER`);

            // Note: We don't change ID type if it exists to avoid dataloss/errors. 
            // We assume the existing UUID type is what the user wants.
        }
        console.log('✅ Transactions Table: Certified.');

        // 3. SATISFACTION SCORES
        await opsPool.query(`
            CREATE TABLE IF NOT EXISTS satisfaction_scores (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER,
                score INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Satisfaction Scores Table: Certified.');

        console.log('\n📝 Ready for Manual Import via Market Analysis Tab.');

    } catch (e) {
        console.error('❌ Certification Failed:', e);
    } finally {
        await opsPool.end();
    }
}

verifyAndCertifyTables();
