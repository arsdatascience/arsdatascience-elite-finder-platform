require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./database');

async function check() {
    try {
        const cust = await pool.query('SELECT count(*) FROM unified_customers');
        const tenants = await pool.query('SELECT count(*) FROM tenants');
        console.log(' unified_customers count:', cust.rows[0].count);
        console.log(' tenants count:', tenants.rows[0].count);

        // Check finding 1 customer to see IDs
        if (cust.rows[0].count > 0) {
            const one = await pool.query('SELECT id FROM unified_customers LIMIT 1');
            console.log(' Sample ID:', one.rows[0].id);
        }

        // Check Tenant ID
        const tenant = await pool.query('SELECT id, name FROM tenants LIMIT 1');
        if (tenant.rows.length > 0) {
            console.log(` TENANT FOUND: ID=${tenant.rows[0].id} Name=${tenant.rows[0].name}`);
        } else {
            console.log(' NO TENANT FOUND!');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
