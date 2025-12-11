const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./database');
const pool = db;

async function updateFullData() {
    try {
        console.log('🔄 Running migration 045...');
        const fs = require('fs');
        const migrationSql = fs.readFileSync(path.join(__dirname, 'migrations', '045_add_customer_ml_metrics.sql'), 'utf8');
        await pool.query(migrationSql);
        console.log('✅ Migration 045 applied (Columns added).');

        console.log('🔄 Fetching ALL customers to update metrics...');
        const customers = await pool.query('SELECT id, created_at FROM unified_customers WHERE tenant_id = 1');

        console.log(`✅ Updating metrics for ${customers.rows.length} customers...`);

        const updates = customers.rows.map(customer => {
            // Logic for realistic data
            // Older customers -> higher LTV possibility
            // Random churn/engagement

            const daysActive = (new Date() - new Date(customer.created_at)) / (1000 * 60 * 60 * 24);

            const purchaseCount = Math.floor(Math.random() * 20); // 0-20 purchases
            const avgOrderValue = 100 + Math.random() * 900; // 100-1000 BRL
            const lifetimeValue = purchaseCount * avgOrderValue;

            const churnProb = Math.random() * 0.8; // 0-80% churn risk
            const engagementScore = Math.floor(Math.random() * 100);

            return pool.query(`
                UPDATE unified_customers 
                SET 
                    lifetime_value = $1,
                    avg_order_value = $2,
                    purchase_count = $3,
                    churn_probability = $4,
                    engagement_score = $5
                WHERE id = $6
            `, [lifetimeValue, avgOrderValue, purchaseCount, churnProb, engagementScore, customer.id]);
        });

        await Promise.all(updates);
        console.log('✅ All customers updated with LTV, Churn, and Engagement data.');

    } catch (e) {
        console.error('Error updating data:', e);
    } finally {
        process.exit(0);
    }
}

updateFullData();
