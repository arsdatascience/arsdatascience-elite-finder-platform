const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./database');
const pool = db;

async function fixAndExpandData() {
    try {
        console.log('🔄 Fetching all unified customers for Tenant 1...');
        const customers = await pool.query('SELECT id, client_id, created_at FROM unified_customers WHERE tenant_id = 1');

        if (customers.rows.length === 0) {
            console.error('❌ No customers found.');
            process.exit(1);
        }

        console.log(`✅ Found ${customers.rows.length} customers. Starting 100% coverage generation...`);

        // TRUNCATE existing surveys to avoid duplication and ensure clean slate matching the count
        await pool.query('TRUNCATE TABLE nps_surveys CASCADE');
        await pool.query('TRUNCATE TABLE csat_surveys CASCADE');
        await pool.query('TRUNCATE TABLE client_health_metrics CASCADE');
        console.log('🧹 Cleared existing survey and metrics tables.');

        const getRandomDate = (start, end) => {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        };

        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        // 1. Generate NPS & CSAT for EVERY customer
        // We'll spread them over the last 6 months so the "Period" filter has data to show
        const npsPromises = [];
        const csatPromises = [];

        let processed = 0;
        for (const customer of customers.rows) {
            const customerCreatedAt = new Date(customer.created_at);
            // Survey date must be AFTER customer creation
            const surveyDate = getRandomDate(customerCreatedAt > sixMonthsAgo ? customerCreatedAt : sixMonthsAgo, now);

            // NPS Logic: Weighted towards Promoters
            const rand = Math.random();
            let npsScore, npsFeedback;
            if (rand > 0.3) {
                npsScore = 9 + Math.floor(Math.random() * 2); // 9-10
                npsFeedback = 'Excelente plataforma, muito intuitiva.';
            } else if (rand > 0.1) {
                npsScore = 7 + Math.floor(Math.random() * 2); // 7-8
                npsFeedback = 'Bom, mas faltam algumas integrações.';
            } else {
                npsScore = Math.floor(Math.random() * 7); // 0-6
                npsFeedback = 'O suporte demorou para responder.';
            }

            npsPromises.push(pool.query(`
                INSERT INTO nps_surveys (tenant_id, client_id, customer_id, score, feedback, touchpoint, responded_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [1, customer.client_id, customer.id, npsScore, npsFeedback, 'quarterly_review', surveyDate]));

            // CSAT Logic: Weighted towards Satisfied
            const csatDate = getRandomDate(customerCreatedAt > sixMonthsAgo ? customerCreatedAt : sixMonthsAgo, now);
            let csatScore;
            if (rand > 0.15) csatScore = 5;
            else if (rand > 0.05) csatScore = 4;
            else csatScore = Math.floor(Math.random() * 3) + 1;

            csatPromises.push(pool.query(`
                INSERT INTO csat_surveys (tenant_id, client_id, customer_id, score, category, responded_at)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [1, customer.client_id, customer.id, csatScore, 'support_ticket', csatDate]));

            processed++;
            if (processed % 50 === 0) console.log(`Processed ${processed}/${customers.rows.length} customers...`);
        }

        await Promise.all(npsPromises);
        await Promise.all(csatPromises);
        console.log(`✅ Generated ${npsPromises.length} NPS and ${csatPromises.length} CSAT surveys covering all customers.`);

        // 2. Populate Client Health Metrics (for Retention Rate)
        // We need data for the current month and previous month to calculate retention
        const clients = await pool.query('SELECT DISTINCT client_id FROM unified_customers WHERE tenant_id = 1');
        const clientIds = clients.rows.map(c => c.client_id).filter(id => id); // Remove nulls

        console.log(`Generating Health Metrics for ${clientIds.length} unique clients...`);
        const healthPromises = [];

        const months = [0, 1]; // Current month (0) and Previous month (1) relative offset

        for (const monthOffset of months) {
            const d = new Date();
            d.setMonth(d.getMonth() - monthOffset);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;

            for (const clientId of clientIds) {
                // Determine if strict retention (active)
                // Let's make 95% of clients active in both months to show high retention
                const isActive = Math.random() > 0.05;
                if (isActive) {
                    healthPromises.push(pool.query(`
                        INSERT INTO client_health_metrics (tenant_id, client_id, period_year, period_month, health_score, churn_risk)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [1, clientId, year, month, 85, 'low']));
                }
            }
        }

        await Promise.all(healthPromises);
        console.log(`✅ Generated ${healthPromises.length} Client Health Metric records.`);

    } catch (e) {
        console.error('Error generating data:', e);
    } finally {
        process.exit(0);
    }
}

fixAndExpandData();
