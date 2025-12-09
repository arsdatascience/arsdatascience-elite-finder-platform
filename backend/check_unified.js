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
