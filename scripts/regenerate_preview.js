const { Pool } = require('pg');
const path = require('path');
const dotenvPath = path.join(process.cwd(), 'backend', '.env');
console.log('📂 Carregando .env de:', dotenvPath);
require('dotenv').config({ path: dotenvPath });

// Debug Env Vars
const mask = (s) => s ? s.substring(0, 15) + '...' : 'UNDEFINED';
console.log('🔌 OPS_DB:', mask(process.env.OPERATIONS_DB_URL));
console.log('🔌 CLIENTS_DB:', mask(process.env.CLIENTS_DATABASE_URL));
console.log('🔌 CORE_DB (Fallback):', mask(process.env.DATABASE_URL));

if (!process.env.CLIENTS_DATABASE_URL && !process.env.DATABASE_URL) {
    console.error('❌ Nenhuma URL de banco encontrada!');
    process.exit(1);
}

// Configurações de conexão
// Ops DB (onde está ml_datasets)
const opsPool = new Pool({
    connectionString: process.env.OPERATIONS_DB_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Core DB (onde está client_metrics)
const clientsPool = new Pool({
    connectionString: process.env.CLIENTS_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const DATASET_ID = '8fa35981-1f43-49c7-ba8e-71cb4bf7bc5c';
const TENANT_ID = '4c468ad9-aa48-4691-90f2-54651adcecc7'; // From debug info

async function regeneratePreview() {
    console.log('🔄 Iniciando regeneração do preview...');

    try {
        // 1. Buscar dados reais na tabela client_metrics
        console.log(`📊 Buscando métricas para tenant: ${TENANT_ID}`);

        const metricsQuery = `
            SELECT date, revenue, orders, visits, marketing_spend
            FROM client_metrics 
            WHERE client_id = $1 
            ORDER BY date DESC 
            LIMIT 50
        `;

        let resMetrics;
        try {
            console.log('Tentando via clientsPool...');
            resMetrics = await clientsPool.query(metricsQuery, [TENANT_ID]);
        } catch (e) {
            console.log('⚠️ Falha no clientsPool:', e.message);
            console.log('Tentando via opsPool...');
            try {
                resMetrics = await opsPool.query(metricsQuery, [TENANT_ID]);
            } catch (e2) {
                console.error('❌ Falha também no opsPool:', e2.message);
                process.exit(1);
            }
        }

        if (resMetrics.rows.length === 0) {
            console.error('❌ Nenhuma métrica encontrada na tabela client_metrics para este cliente.');
            // Fallback: Tentar buscar tudo para debug
            const countRes = await clientsPool.query('SELECT count(*) FROM client_metrics WHERE client_id = $1', [TENANT_ID]);
            console.log('Count total:', countRes.rows[0].count);
            process.exit(1);
        }

        console.log(`✅ ${resMetrics.rows.length} registros encontrados.`);

        // 2. Formatar para o preview (Array de Arrays ou Array de Objetos)
        // O frontend espera Array de Objetos para novas versões, mas vamos ver o que o controller faz.
        // O controller lê 'preview' do JSONB.

        const previewData = resMetrics.rows.map(row => ({
            date: row.date.toISOString().split('T')[0],
            orders: row.orders || 0,
            visits: row.visits || 0,
            revenue: parseFloat(row.revenue) || 0,
            marketing_spend: parseFloat(row.marketing_spend) || 0
        }));

        console.log('📝 Amostra do novo preview:', previewData[0]);

        // 3. Atualizar ml_datasets
        // Precisamos preservar o statistics existente, mas atualizar o preview dentro dele
        // SE o statistics for "flat", precisamos converter para nested { preview, columnStats }

        // Primeiro, pegamos o registro atual
        const dsRes = await opsPool.query('SELECT statistics FROM ml_datasets WHERE id = $1', [DATASET_ID]);
        if (dsRes.rows.length === 0) {
            console.error('❌ Dataset não encontrado no banco Ops.');
            process.exit(1);
        }

        let stats = dsRes.rows[0].statistics || {};

        // Lógica de migração para estrutura nested
        let newStats = {};

        // Se já tiver a estrutura nova
        if (stats.columnStats) {
            newStats = {
                ...stats,
                preview: previewData
            };
        } else {
            // Se for flat (legado), movemos tudo para columnStats
            newStats = {
                columnStats: stats,
                preview: previewData
            };
        }

        console.log('💾 Salvando novo JSONB statistics...');

        await opsPool.query(
            'UPDATE ml_datasets SET statistics = $1, updated_at = NOW() WHERE id = $2',
            [newStats, DATASET_ID]
        );

        console.log('✅ Dataset atualizado com sucesso!');

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await opsPool.end();
        await clientsPool.end();
    }
}

regeneratePreview();
