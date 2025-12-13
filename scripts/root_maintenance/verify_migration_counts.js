
const { Pool } = require('pg');
const fs = require('fs');

// Source: Core
const corePool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: { rejectUnauthorized: false }
});

// Dest: Maglev
const maglevPool = new Pool({
    connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
    ssl: { rejectUnauthorized: false }
});

const TABLES = [
    'financial_categories',
    'suppliers',
    'financial_transactions',
    'services',
    'service_catalog',
    'asset_folders',
    'assets',
    'project_templates',
    'templates',
    'template_items',
    'approval_requests',
    'projects',
    'project_members',
    'tasks',
    'task_comments',
    'project_activity_log'
];

async function verify() {
    const logBuffer = [];

    const log = (...args) => {
        const msg = args.map(a => String(a)).join(' ');
        console.log(msg);
        logBuffer.push(msg);
    };

    log('🔍 VERIFYING MIGRATION (Row Count Comparison)...');
    log('---------------------------------------------------');
    log(String('TABLE').padEnd(30) + String('CORE').padEnd(10) + String('MAGLEV').padEnd(10) + 'STATUS');
    log('---------------------------------------------------');

    const core = await corePool.connect();
    const maglev = await maglevPool.connect();

    let allMatch = true;

    try {
        for (const table of TABLES) {
            let coreCount = 0;
            let maglevCount = 0;
            let existsInCore = true;

            // Check Core
            try {
                const res = await core.query(`SELECT COUNT(*) FROM ${table}`);
                coreCount = parseInt(res.rows[0].count);
            } catch (e) {
                existsInCore = false;
                // logs.push(`INFO: Table ${table} not in Core.`);
                coreCount = 0;
            }

            // Check Maglev
            try {
                const res = await maglev.query(`SELECT COUNT(*) FROM ${table}`);
                maglevCount = parseInt(res.rows[0].count);
            } catch (e) {
                maglevCount = 'ERR';
                log(`Error checking Maglev ${table}: ${e.message}`);
            }

            // Mismatch Logic:
            // If Core is 0 and Maglev is 0, OK.
            // If Core is >0 and Maglev != Core, MISMATCH.

            const match = (coreCount === maglevCount);
            if (!match) allMatch = false;

            const status = match ? '✅ OK' : '❌ MISMATCH';
            log(
                String(table).padEnd(30) +
                String(coreCount).padEnd(10) +
                String(maglevCount).padEnd(10) +
                status
            );
        }
    } catch (err) {
        log('Verification Error: ' + err.message);
    } finally {
        core.release();
        maglev.release();
        corePool.end();
        maglevPool.end();

        log('---------------------------------------------------');
        if (allMatch) {
            log('✨ SUCCESS: All table counts match!');
        } else {
            log('⚠️  WARNING: Some tables do not match. Do not delete Source yet!');
        }

        fs.writeFileSync('verification_report.txt', logBuffer.join('\n'), 'utf8');
        console.log('Report saved to verification_report.txt');
    }
}

verify();
