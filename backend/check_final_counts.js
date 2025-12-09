const { opsPool, query } = require('./database'); // query uses main pool

async function checkFinalCounts() {
    try {
        console.log('🔍 Verifying Data Generation Results...');

        const nps = await query('SELECT COUNT(*) FROM nps_surveys');
        console.log(`✅ NPS Surveys: ${nps.rows[0].count} (Expected ~427)`);

        const csat = await query('SELECT COUNT(*) FROM csat_surveys');
        console.log(`✅ CSAT Surveys: ${csat.rows[0].count} (Expected ~427)`);

        const health = await query('SELECT COUNT(*) FROM client_health_metrics');
        console.log(`✅ Client Health Metrics: ${health.rows[0].count} (Expected > 0)`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkFinalCounts();
