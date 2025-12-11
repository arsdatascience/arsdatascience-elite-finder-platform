const { opsPool } = require('./database');

async function run() {
    try {
        const res = await opsPool.query("DELETE FROM projects WHERE name ILIKE '%Teste%' OR name = 'New Project'");
        console.log('Deleted:', res.rowCount);
    } catch (e) {
        console.error(e);
    } finally {
        await opsPool.end();
    }
}

run();
