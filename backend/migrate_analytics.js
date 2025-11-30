require('dotenv').config();
const db = require('./database');

async function migrate() {
    try {
        console.log('Iniciando migração de banco de dados...');

        // Adicionar colunas para analytics e tracking de custos
        await db.query(`
            ALTER TABLE generated_images 
            ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 4) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
            ADD COLUMN IF NOT EXISTS generation_time INTEGER,
            ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'
        `);

        // Atualizar registros antigos para ter valores padrão
        await db.query(`
            UPDATE generated_images 
            SET provider = 'replicate' 
            WHERE provider IS NULL AND (model LIKE '%flux%' OR model LIKE '%sdxl%' OR model LIKE '%z-image%')
        `);

        await db.query(`
            UPDATE generated_images 
            SET provider = 'huggingface' 
            WHERE provider IS NULL AND model LIKE '%stable-diffusion%'
        `);

        console.log('Migração concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro fatal na migração:', error);
        process.exit(1);
    }
}

migrate();
