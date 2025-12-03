const pool = require('./database');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
    try {
        console.log('Verificando migrações pendentes...');

        // Lista de migrações críticas que precisam rodar
        const migrations = [
            '008_add_ai_meta_params.sql',
            '009_add_vector_meta_params.sql',
            '010_add_advanced_settings.sql',
            '011_create_campaign_metrics.sql',
            '016_create_integrations_table.sql',
            '017_create_sales_coaching_template.sql',
            '018_add_whatsapp_column_to_clients.sql',
            '019_add_tags_to_leads.sql'
        ];

        for (const migrationFile of migrations) {
            const filePath = path.join(__dirname, 'migrations', migrationFile);
            if (fs.existsSync(filePath)) {
                const sql = fs.readFileSync(filePath, 'utf8');
                // Tentar rodar. Se já existir coluna, o SQL deve usar IF NOT EXISTS ou falhar graciosamente.
                // Minha migração 008 usa ADD COLUMN IF NOT EXISTS, então é seguro rodar múltiplas vezes (no Postgres moderno).
                // Nota: ADD COLUMN IF NOT EXISTS requer Postgres 9.6+.

                try {
                    await pool.query(sql);
                    console.log(`Migração ${migrationFile} aplicada com sucesso.`);
                } catch (err) {
                    console.warn(`Aviso ao aplicar ${migrationFile}: ${err.message}`);
                }
            }
        }
    } catch (error) {
        console.error('Erro fatal ao rodar migrações:', error);
    }
};

module.exports = runMigrations;
