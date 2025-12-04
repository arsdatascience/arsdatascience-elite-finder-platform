const { Pool } = require('pg');

// Using the connection string provided by the user
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const runFix = async () => {
    console.log('🚀 Iniciando correção de Schema (Colunas e Índices)...');

    const queries = [
        // 1. Corrigir tabela LEADS
        `DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='tenant_id') THEN 
                ALTER TABLE leads ADD COLUMN tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE; 
                -- RAISE NOTICE 'Coluna tenant_id adicionada em leads';
            END IF; 
        END $$;`,

        // 2. Corrigir tabela AUTOMATION_WORKFLOWS
        `DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='automation_workflows' AND column_name='client_id') THEN 
                ALTER TABLE automation_workflows ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE; 
            END IF; 
        END $$;`,

        `DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='automation_workflows' AND column_name='tenant_id') THEN 
                ALTER TABLE automation_workflows ADD COLUMN tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE; 
            END IF; 
        END $$;`,

        // 3. Criar Índices que falharam anteriormente
        "CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);",
        "CREATE INDEX IF NOT EXISTS idx_automation_workflows_client ON automation_workflows(client_id);",
        "CREATE INDEX IF NOT EXISTS idx_automation_workflows_tenant ON automation_workflows(tenant_id);"
    ];

    for (const query of queries) {
        try {
            await pool.query(query);
            console.log(`✅ Comando executado com sucesso.`);
        } catch (error) {
            console.error(`❌ Erro ao executar comando: ${error.message}`);
            // Não parar o loop, tentar os próximos
        }
    }

    console.log('🏁 Correção de Schema concluída.');
    process.exit(0);
};

runFix();
