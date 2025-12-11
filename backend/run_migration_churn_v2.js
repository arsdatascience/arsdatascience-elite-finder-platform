const db = require('./database');

async function migrate() {
    console.log('🚀 Iniciando Migração: Infraestrutura de Churn Cirúrgico...');

    try {
        // 1. Atualizar Tabela CLIENTS
        console.log('📦 Atualizando tabela clients...');
        await db.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'active', -- active, overdue, cancelled
            ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100;
        `);

        // 2. Atualizar Tabela USERS
        console.log('👤 Atualizando tabela users...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
        `);

        // 3. Criar Tabela TICKETS (Suporte)
        console.log('🎫 Criando tabela tickets...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER, -- FK flexível para evitar erros em dev
                client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
                priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON tickets(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client_id);
        `);

        // 4. Criar Tabela MEETING_ANALYSES (IA Sentimento)
        console.log('🧠 Criando tabela meeting_analyses...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS meeting_analyses (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER, -- FK flexível
                client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                meeting_date TIMESTAMP DEFAULT NOW(),
                summary TEXT,
                sentiment_score DECIMAL(5,2), -- 0.00 a 1.00
                risk_tags TEXT[], -- Array de strings
                audio_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_meetings_tenant ON meeting_analyses(tenant_id);
        `);

        console.log('✅ Migração Concluída com Sucesso!');
    } catch (error) {
        console.error('❌ Erro na migração:', error);
    } finally {
        process.exit();
    }
}

migrate();
