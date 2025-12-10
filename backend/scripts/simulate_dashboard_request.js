
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
    console.log('🚀 Simulating Dashboard Request...');

    // Default params (same as failing request)
    const tenantId = '6666cd85-115f-4091-a6b6-946b68597321'; // Using a known valid or dummy tenant UUID if unknown, or NULL if testing generic
    // Actually let's use NULL to test generic query crash
    const queryParams = { startDate: '', endDate: '', clientId: 'all', stage: 'all' };

    try {
        console.log('1. Date Parsing...');
        const now = new Date();
        const startDateStr = queryParams.startDate;
        const endDateStr = queryParams.endDate;

        const startDate = (startDateStr && startDateStr !== 'null' && startDateStr !== 'undefined' && startDateStr !== '')
            ? new Date(startDateStr)
            : new Date(now.getFullYear(), now.getMonth(), 1);

        const endDate = (endDateStr && endDateStr !== 'null' && endDateStr !== 'undefined' && endDateStr !== '')
            ? new Date(endDateStr)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        console.log('Dates:', startDate, endDate);

        const clientFilter = (queryParams.clientId && queryParams.clientId !== 'all') ? 'AND client_id = $4' : 'AND ($4::text IS NULL OR TRUE)';

        // Use a valid tenant ID if possible, otherwise use null (if allowed by query)
        // Let's first fetch a real tenant ID to be realistic
        const tRes = await pool.query('SELECT id FROM tenants LIMIT 1');
        const realTenantId = tRes.rows[0]?.id;
        console.log('Using Tenant:', realTenantId);

        const dbParams = [realTenantId, startDate, endDate, null, null];

        console.log('2. Running Queries...');

        // 1. NPS
        try {
            console.log('   - Querying NPS...');
            await pool.query(`
                SELECT AVG(score) as avg_score FROM nps_surveys
                WHERE (tenant_id = $1 OR $1 IS NULL) AND responded_at >= $2 AND responded_at <= $3
            `, dbParams.slice(0, 3)); // Simplified
            console.log('   ✅ NPS OK');
        } catch (e) { console.error('   ❌ NPS ERROR:', e.message); }

        // 2. CSAT
        try {
            console.log('   - Querying CSAT...');
            await pool.query(`
                SELECT AVG(score) FROM csat_surveys
                WHERE (tenant_id = $1 OR $1 IS NULL) AND responded_at >= $2 AND responded_at <= $3
            `, dbParams.slice(0, 3));
            console.log('   ✅ CSAT OK');
        } catch (e) { console.error('   ❌ CSAT ERROR:', e.message); }

        // 3. Retention (The complex one)
        try {
            console.log('   - Querying Retention...');
            const prevDate = new Date(startDate);
            prevDate.setMonth(prevDate.getMonth() - 1);

            const rParams = [
                realTenantId,
                prevDate.getFullYear(), prevDate.getMonth() + 1,
                startDate.getFullYear(), startDate.getMonth() + 1
            ];

            // Check query syntax from controller
            const retentionQuery = `
                WITH prev_month_clients AS (
                    SELECT DISTINCT client_id
                    FROM client_health_metrics
                    WHERE (tenant_id = $1 OR $1 IS NULL)
                      AND period_year = $2 AND period_month = $3
                ),
                current_month_clients AS (
                    SELECT DISTINCT client_id
                    FROM client_health_metrics
                    WHERE (tenant_id = $1 OR $1 IS NULL)
                      AND period_year = $4 AND period_month = $5
                )
                SELECT (SELECT COUNT(*) FROM prev_month_clients) as prev_count
            `;
            await pool.query(retentionQuery, rParams);
            console.log('   ✅ Retention OK');
        } catch (e) { console.error('   ❌ Retention ERROR:', e.message); }

        // 4. Financial
        try {
            console.log('   - Querying Financial...');
            await opsPool.query(`
                SELECT SUM(amount) FROM financial_transactions
                WHERE date >= $1 AND date <= $2
            `, [startDate, endDate]);
            console.log('   ✅ Financial OK');
        } catch (e) { console.error('   ❌ Financial ERROR:', e.message); }

        // 5. CLV
        try {
            console.log('   - Querying CLV...');
            await pool.query(`
                SELECT AVG(lifetime_value) FROM unified_customers
                WHERE (tenant_id = $1 OR $1 IS NULL) AND lifetime_value > 0
            `, [realTenantId]);
            console.log('   ✅ CLV OK');
        } catch (e) { console.error('   ❌ CLV ERROR:', e.message); }

    } catch (e) {
        console.error('🔥 MAIN ERROR:', e);
    } finally {
        pool.end();
    }
}

simulate();
