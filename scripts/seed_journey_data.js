const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { pool, opsPool } = require('../backend/database');

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

async function seedData() {
    console.log(`--- Seeding Customer Journey Data for Tenant: ${TENANT_ID} ---`);

    try {
        const client = await pool.connect();
        const opsClient = await opsPool.connect();

        // 0. Clean Slate
        console.log('Dropping existing tables...');
        await client.query('DROP TABLE IF EXISTS unified_customers CASCADE');
        await client.query('DROP TABLE IF EXISTS customer_interactions CASCADE');
        await client.query('DROP TABLE IF EXISTS conversion_events CASCADE');
        await opsClient.query('DROP TABLE IF EXISTS projects CASCADE');
        await opsClient.query('DROP TABLE IF EXISTS tasks CASCADE');
        await opsClient.query('DROP TABLE IF EXISTS transactions CASCADE');

        // 1. Unified Customers (Crossover)
        console.log('Seeding Customers...');
        await client.query(`
            CREATE TABLE unified_customers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID,
                name VARCHAR(255),
                email VARCHAR(255),
                current_stage VARCHAR(50),
                lifetime_value DECIMAL(10,2),
                purchase_count INTEGER,
                channel_mix JSONB,
                tags JSONB,
                last_interaction TIMESTAMP,
                cart_value DECIMAL(10,2) DEFAULT 0
            );
        `);

        const stages = ['awareness', 'consideration', 'purchase', 'retention', 'advocacy'];
        const channels = ['whatsapp', 'email', 'instagram', 'linkedin', 'phone'];

        for (let i = 0; i < 50; i++) {
            const stage = stages[Math.floor(Math.random() * stages.length)];
            await client.query(`
                INSERT INTO unified_customers (tenant_id, name, email, current_stage, lifetime_value, purchase_count, channel_mix, tags, last_interaction, cart_value)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - (random() * interval '30 days'), $9)
            `, [
                TENANT_ID,
                `Customer ${i + 1}`,
                `customer${i + 1}@example.com`,
                stage,
                (Math.random() * 5000).toFixed(2),
                Math.floor(Math.random() * 20),
                JSON.stringify({ primary: channels[Math.floor(Math.random() * channels.length)] }),
                JSON.stringify(['vip', 'new']),
                Math.random() > 0.8 ? (Math.random() * 500).toFixed(2) : 0
            ]);
        }

        // 2. Customer Interactions (Crossover)
        console.log('Seeding Interactions...');
        await client.query(`
           CREATE TABLE customer_interactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID,
                channel VARCHAR(50),
                interaction_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW()
           );
        `);

        for (let i = 0; i < 200; i++) {
            await client.query(`
                INSERT INTO customer_interactions (tenant_id, channel, interaction_type, created_at)
                VALUES ($1, $2, $3, NOW() - (random() * interval '30 days'))
            `, [
                TENANT_ID,
                channels[Math.floor(Math.random() * channels.length)],
                ['message', 'click', 'view', 'call'][Math.floor(Math.random() * 4)]
            ]);
        }

        // 3. Conversion Events
        console.log('Seeding Conversions...');
        await client.query(`
            CREATE TABLE conversion_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID,
                conversion_type VARCHAR(50),
                conversion_value DECIMAL(10,2),
                first_touch_channel VARCHAR(50),
                last_touch_channel VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        for (let i = 0; i < 30; i++) {
            await client.query(`
                INSERT INTO conversion_events (tenant_id, conversion_type, conversion_value, first_touch_channel, last_touch_channel, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW() - (random() * interval '30 days'))
            `, [
                TENANT_ID,
                'purchase',
                (Math.random() * 1000).toFixed(2),
                channels[Math.floor(Math.random() * channels.length)],
                channels[Math.floor(Math.random() * channels.length)]
            ]);
        }

        // 4. Projects (Megalev)
        console.log('Seeding Projects...');
        await opsClient.query(`
             CREATE TABLE projects (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID,
                name VARCHAR(255),
                status VARCHAR(50),
                client_id UUID,
                budget DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT NOW()
             );
        `);

        for (let i = 0; i < 15; i++) {
            await opsClient.query(`
                INSERT INTO projects (tenant_id, name, status, budget, created_at)
                VALUES ($1, $2, $3, $4, NOW() - (random() * interval '60 days'))
            `, [
                TENANT_ID,
                `Project Alpha ${i}`,
                ['active', 'completed', 'planning'][Math.floor(Math.random() * 3)],
                (Math.random() * 50000).toFixed(2)
            ]);
        }

        // 5. Tasks (Megalev)
        console.log('Seeding Tasks...');
        await opsClient.query(`
             CREATE TABLE tasks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID,
                status VARCHAR(50),
                title VARCHAR(255)
             );
        `);

        for (let i = 0; i < 80; i++) {
            await opsClient.query(`
                INSERT INTO tasks (tenant_id, status, title)
                VALUES ($1, $2, $3)
            `, [
                TENANT_ID,
                ['todo', 'in_progress', 'done', 'review'][Math.floor(Math.random() * 4)],
                `Task ${i}`
            ]);
        }

        // 6. Transactions (Megalev) - Already exists but adding more recent ones
        console.log('Seeding Recent Transactions...');
        await opsClient.query(`
            CREATE TABLE transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID,
                type VARCHAR(50),
                amount DECIMAL(15,2),
                date TIMESTAMP
            );
        `);

        for (let i = 0; i < 20; i++) {
            await opsClient.query(`
                INSERT INTO transactions (tenant_id, type, amount, date)
                VALUES ($1, $2, $3, NOW() - (random() * interval '30 days'))
            `, [
                TENANT_ID,
                Math.random() > 0.3 ? 'income' : 'expense',
                (Math.random() * 5000).toFixed(2)
            ]);
        }

        console.log('✅ Seeding Complete!');
        client.release();
        opsClient.release();
        process.exit(0);

    } catch (err) {
        console.error('Seeding Failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
        await opsPool.end();
    }
}

seedData();
