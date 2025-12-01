const { Pool } = require('pg');

// Tentando conectar no banco "postgres"
const connectionString = 'postgresql://postgres:postgres@localhost:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
});

async function fixPrices() {
    try {
        console.log('Iniciando correção de preços no banco postgres...');

        // Atualizar Plano Pro
        const resPro = await pool.query("UPDATE plans SET price = 997 WHERE name = 'Pro'");
        console.log(`Plano Pro atualizado: ${resPro.rowCount} linhas afetadas.`);

        // Atualizar Plano Enterprise
        const resEnt = await pool.query("UPDATE plans SET price = 1397 WHERE name = 'Enterprise'");
        console.log(`Plano Enterprise atualizado: ${resEnt.rowCount} linhas afetadas.`);

        console.log('Correção concluída com sucesso!');
    } catch (err) {
        console.error('Erro ao atualizar preços:', err);
    } finally {
        await pool.end();
    }
}

fixPrices();
