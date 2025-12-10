
const { Pool } = require('pg');
const path = require('path');
const { faker } = require('@faker-js/faker'); // Assuming faker is available or I'll implement simple randomizers
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

// Simple random helpers if faker isn't installed
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

const pool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function seed() {
    const client = await pool.connect();
    try {
        console.log('--- Seeding Explore Modal Data ---');

        // 1. Fetch Customers
        const res = await client.query(`SELECT id, name, email FROM unified_customers LIMIT 50`);
        const customers = res.rows;
        console.log(`Found ${customers.length} customers to seed.`);

        for (const customer of customers) {
            // A. Update Profile Stats
            const churn = randomFloat(0.01, 0.35); // 1% to 35%
            const engagement = randomInt(15, 98); // 15 to 98

            await client.query(`
                UPDATE unified_customers 
                SET churn_probability = $1, engagement_score = $2
                WHERE id = $3
            `, [churn, engagement, customer.id]);

            // B. Seed Identity Graph
            const idCount = randomInt(1, 4);
            for (let i = 0; i < idCount; i++) {
                const type = randomElement(['email', 'phone', 'cookie', 'device_id']);
                let value = '';
                if (type === 'email') value = `alt_${Math.random().toString(36).substring(7)}@gmail.com`;
                if (type === 'phone') value = `+55119${randomInt(10000000, 99999999)}`;
                if (type === 'cookie') value = `ga_${Math.random().toString(36).substring(2)}`;
                if (type === 'device_id') value = `dev_${Math.random().toString(36).substring(2)}`;

                await client.query(`
                    INSERT INTO identity_graph (customer_id, identifier_type, identifier_value, source_channel, confidence_score, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW() - (random() * interval '30 days'))
                    ON CONFLICT DO NOTHING
                `, [customer.id, type, value, 'marketing_automation', randomFloat(0.7, 0.99)]);
            }

            // C. Seed Timeline (Customer Interactions)
            const interactionCount = randomInt(3, 12);
            for (let i = 0; i < interactionCount; i++) {
                const type = randomElement(['page_view', 'email_open', 'email_click', 'form_submit', 'purchase', 'support_ticket']);
                const channel = randomElement(['web', 'email', 'mobile_app', 'whatsapp']);
                let details = {};

                if (type === 'page_view') details = { url: randomElement(['/pricing', '/home', '/features', '/blog', '/checkout']), title: 'Page Visit' };
                if (type === 'email_open') details = { subject: 'Welcome to Elite Finder', campaign_id: 'cmp_123' };
                if (type === 'purchase') details = { order_id: `ord_${randomInt(1000, 9999)}`, amount: randomFloat(50, 500).toFixed(2) };
                if (type === 'support_ticket') details = { subject: 'Password Reset', status: 'closed' };

                await client.query(`
                    INSERT INTO customer_interactions (customer_id, interaction_type, channel, details, sentiment_score, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW() - (random() * interval '60 days'))
                `, [customer.id, type, channel, JSON.stringify(details), randomFloat(0.1, 1.0)]);
            }

            process.stdout.write('.');
        }
        console.log('\n✅ Seed completed successfully!');

    } catch (e) {
        console.error('Error seeding data:', e);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
