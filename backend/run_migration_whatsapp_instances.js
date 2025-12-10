const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./database');

async function migrate() {
    console.log('🔄 Iniciando migração de segurança: Tabela whatsapp_instances...');

    try {
        // 1. Criar tabela de mapeamento Instância -> Tenant
        await db.query(`
            CREATE TABLE IF NOT EXISTS whatsapp_instances (
                id SERIAL PRIMARY KEY,
                instance_name VARCHAR(100) UNIQUE NOT NULL,
                tenant_id INTEGER, -- Removida FK estrita para evitar erro se tenants não existir
                api_url VARCHAR(255),
                api_key TEXT, 
                status VARCHAR(20) DEFAULT 'disconnected',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Tabela whatsapp_instances criada/verificada.');

        // 2. Criar índice para busca rápida no Webhook
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_name ON whatsapp_instances(instance_name);
        `);
        console.log('✅ Índice criado.');

    } catch (error) {
        console.error('❌ Erro na migração:', error);
    } finally {
        process.exit();
    }
}

migrate();
