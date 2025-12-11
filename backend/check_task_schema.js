const { opsPool } = require('./database');

async function run() {
    try {
        const res = await opsPool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks'");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await opsPool.end();
    }
}

run();
