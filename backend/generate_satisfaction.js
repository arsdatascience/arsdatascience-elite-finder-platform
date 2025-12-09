const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./database');
const pool = db;

async function generateSatisfactionData() {
    try {
        console.log('🔄 Fetching customers...');
        // Remove LIMIT to get all 427 customers
        const customers = await pool.query('SELECT id, tenant_id FROM unified_customers WHERE tenant_id = 1');

        if (customers.rows.length === 0) {
            console.error('❌ No customers found. Run generate_omnichannel_csv.js first.');
            process.exit(1);
        }

        console.log(`✅ Found ${customers.rows.length} customers. Generating full survey coverage...`);

        // Helper to get random date in last 30 days
        const getRandomDate = () => {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            return date.toISOString();
        };

        // 1. Generate NPS Surveys
        // Goal: Mostly Promoters (9-10), some Passives (7-8), few Detractors (0-6)
        const npsValues = [];
        for (const customer of customers.rows) {
            const rand = Math.random();
            let score;
            if (rand > 0.3) score = 9 + Math.floor(Math.random() * 2); // 70% Promoters (9-10)
            else if (rand > 0.1) score = 7 + Math.floor(Math.random() * 2); // 20% Passives (7-8)
            else score = Math.floor(Math.random() * 7); // 10% Detractors (0-6)

            const feedback = score >= 9 ? 'Excelente serviço!' : (score >= 7 ? 'Bom, mas pode melhorar.' : 'Insatisfeito com o prazo.');

            npsValues.push(pool.query(`
                INSERT INTO nps_surveys (tenant_id, customer_id, score, feedback, touchpoint, responded_at)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [1, customer.id, score, feedback, 'project_delivery', getRandomDate()]));
        }
        await Promise.all(npsValues);
        console.log(`✅ Generated ${npsValues.length} NPS surveys.`);

        // 2. Generate CSAT Surveys
        const csatValues = [];
        for (const customer of customers.rows) {
            const rand = Math.random();
            let score;
            if (rand > 0.2) score = 5;
            else if (rand > 0.05) score = 4;
            else score = Math.floor(Math.random() * 3) + 1;

            csatValues.push(pool.query(`
                INSERT INTO csat_surveys (tenant_id, customer_id, score, category, responded_at)
                VALUES ($1, $2, $3, $4, $5)
            `, [1, customer.id, score, 'service_quality', getRandomDate()]));
        }
        await Promise.all(csatValues);
        console.log(`✅ Generated ${csatValues.length} CSAT surveys.`);

        // 3. Generate Employee Happiness (for completeness)
        const happinessValues = [];
        for (let i = 0; i < 10; i++) {
            happinessValues.push(pool.query(`
                INSERT INTO employee_happiness (tenant_id, happiness_score, workload_score, feedback, survey_week)
                VALUES ($1, $2, $3, $4, CURRENT_DATE - ($5 * INTERVAL '1 day'))
            `, [1, 8 + Math.floor(Math.random() * 3), 3, 'Time motivado!', i * 7]));
        }
        await Promise.all(happinessValues);
        console.log('✅ Generated Employee Happiness data.');

    } catch (e) {
        console.error('Error generating data:', e);
    } finally {
        process.exit(0);
    }
}

generateSatisfactionData();
