
// Hardcoded for debugging because local .env is missing/broken
const { Pool } = require('pg');

const coreString = 'postgres://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString: coreString,
    ssl: { rejectUnauthorized: false }
});

// Mock OpsPool as same pool
const opsPool = pool;

async function simulate() {
    console.log('🚀 Simulating Dashboard Request (FULL)...');

    // Default params (same as failing request)
    const tenantId = '6666cd85-115f-4091-a6b6-946b68597321';
    const queryParams = { startDate: '', endDate: '', clientId: 'all', stage: 'all' };

    try {
        console.log('1. Date Parsing...');
        const now = new Date();
        const startDateStr = queryParams.startDate;
        const endDateStr = queryParams.endDate;

        const startDate = (startDateStr && startDateStr !== 'null' && startDateStr !== '')
            ? new Date(startDateStr)
            : new Date(now.getFullYear(), now.getMonth(), 1);

        const endDate = (endDateStr && endDateStr !== 'null' && endDateStr !== '')
            ? new Date(endDateStr)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        console.log('Dates:', startDate, endDate);

        // Fetch real tenant
        const tRes = await pool.query('SELECT id FROM tenants LIMIT 1');
        const realTenantId = tRes.rows[0]?.id;
        console.log('Using Tenant:', realTenantId);

        const dbParams = [realTenantId, startDate, endDate, null, null];

        console.log('2. Running Queries...');

        // 1. NPS
        await runQuery('NPS', async () => {
            return pool.query(`
                SELECT AVG(score) as avg_score FROM nps_surveys
                WHERE (tenant_id = $1 OR $1 IS NULL) AND responded_at >= $2 AND responded_at <= $3
            `, dbParams.slice(0, 3));
        });

        // 2. CSAT
        await runQuery('CSAT', async () => {
            return pool.query(`
                SELECT AVG(score) FROM csat_surveys
                WHERE (tenant_id = $1 OR $1 IS NULL) AND responded_at >= $2 AND responded_at <= $3
            `, dbParams.slice(0, 3));
        });

        // 3. Retention
        await runQuery('Retention', async () => {
            const prevDate = new Date(startDate);
            prevDate.setMonth(prevDate.getMonth() - 1);
            const rParams = [realTenantId, prevDate.getFullYear(), prevDate.getMonth() + 1, startDate.getFullYear(), startDate.getMonth() + 1];

            return pool.query(`
                WITH prev_clients AS (
                    SELECT DISTINCT client_id FROM client_health_metrics 
                    WHERE (tenant_id = $1 OR $1 IS NULL) AND period_year = $2 AND period_month = $3
                )
                SELECT COUNT(*) FROM prev_clients
            `, rParams);
        });

        // 4. Financial (Wrapped in try/catch in controller too)
        try {
            console.log('   - Querying Financial...');
            await opsPool.query(`SELECT SUM(amount) FROM financial_transactions WHERE date >= $1 AND date <= $2`, [startDate, endDate]);
            console.log('   ✅ Financial OK');
        } catch (e) {
            console.error('   ⚠️ Financial FAILED but Caught:', e.message);
            // Do NOT throw, simulating controller behavior
        }

        // 5. CLV
        await runQuery('CLV', async () => {
            return pool.query(`
                SELECT AVG(lifetime_value) FROM unified_customers
                WHERE (tenant_id = $1 OR $1 IS NULL) AND lifetime_value > 0
            `, [realTenantId]);
        });

        // 6. Journey Distribution
        await runQuery('Journey Distribution', async () => {
            return pool.query(`
                SELECT current_stage, COUNT(*) as count
                FROM unified_customers
                WHERE (tenant_id = $1 OR $1 IS NULL)
                GROUP BY current_stage
            `, [realTenantId]);
        });

        // 7. Employee Happiness
        await runQuery('Employee Happiness', async () => {
            return pool.query(`
                SELECT AVG(happiness_score) as avg_happiness
                FROM employee_happiness
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND submitted_at >= $2 AND submitted_at <= $3
            `, dbParams.slice(0, 3));
        });

        console.log('🎉 ALL QUERIES FINISHED (Simulating Response Send)');

    } catch (e) {
        console.error('🔥 CRITICAL SIMULATION ERROR:', e);
    } finally {
        pool.end();
    }
}

async function runQuery(name, fn) {
    try {
        console.log(`   - Querying ${name}...`);
        await fn();
        console.log(`   ✅ ${name} OK`);
    } catch (e) {
        console.error(`   ❌ ${name} ERROR:`, e.message);
        throw e; // Rethrow to simulate controller crash behavior for non-financial queries
    }
}

simulate();
