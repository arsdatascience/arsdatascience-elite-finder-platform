require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./database');

async function cleanOmnichannel() {
    const client = await pool.connect();
    try {
        console.log('🧹 Limpando tabelas Omnichannel (mantendo Clients/Tenants intactos)...');

        await client.query('BEGIN');

        // Ordem importa devido às FKs
        const tables = [
            'conversion_events',
            'customer_interactions',
            'customer_journeys',
            'identity_graph',
            'journey_step_templates',
            'unified_customers' // Tabela pai
        ];

        for (const table of tables) {
            console.log(`   - Limpando ${table}...`);
            await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        }

        await client.query('COMMIT');
        console.log('✅ Base Omnichannel limpa com sucesso! Pronta para importação sincronizada.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao limpar tabelas:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanOmnichannel();
