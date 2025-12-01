const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function listDbs() {
    try {
        await client.connect();
        const res = await client.query('SELECT datname FROM pg_database');
        console.log('Bancos de dados encontrados:');
        res.rows.forEach(row => console.log(row.datname));
    } catch (err) {
        console.error('Erro ao listar bancos:', err);
    } finally {
        await client.end();
    }
}

listDbs();
