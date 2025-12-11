const pool = require('./database');

const runMigration = async () => {
    console.log('🚀 Iniciando migração de performance (Índices)...');

    const queries = [
        // 1. Índices para Multi-tenancy (CRÍTICO)
        "CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);",
        "CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);",
        "CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant ON financial_transactions(tenant_id);",
        "CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);", // Se tabela leads existir

        // 2. Índices para Buscas Frequentes
        "CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);",
        "CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);",
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",

        // 3. Índices para Chaves Estrangeiras (Joins)
        "CREATE INDEX IF NOT EXISTS idx_social_posts_client ON social_posts(client_id);",
        "CREATE INDEX IF NOT EXISTS idx_automation_workflows_client ON automation_workflows(client_id);",
        "CREATE INDEX IF NOT EXISTS idx_financial_transactions_client ON financial_transactions(client_id);",
        "CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category_id);",

        // 4. Índices para Ordenação e Filtros de Data (Dashboards)
        "CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);",
        "CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_date);",
        "CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at);"
    ];

    for (const query of queries) {
        try {
            await pool.query(query);
            console.log(`✅ Índice criado/verificado: ${query.split('ON')[1] || query}`);
        } catch (error) {
            // Ignorar erro se tabela não existir (pode acontecer em dev)
            if (error.code === '42P01') { // undefined_table
                console.warn(`⚠️ Tabela não encontrada para índice: ${query}`);
            } else {
                console.error(`❌ Erro ao criar índice: ${error.message}`);
            }
        }
    }

    console.log('🏁 Migração de performance concluída.');
    process.exit(0);
};

runMigration();
