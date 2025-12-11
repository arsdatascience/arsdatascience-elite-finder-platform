const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Tentar carregar .env de múltiplos locais
const envPaths = [
    path.join(__dirname, '../.env'), // backend/.env
    path.join(__dirname, '../../.env') // root/.env
];

for (const p of envPaths) {
    const result = dotenv.config({ path: p });
    if (!result.error) {
        console.log(`✅ Loaded .env from ${p}`);
        break;
    }
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function updateSchema() {
    let client;
    try {
        client = await pool.connect();
        console.log('🔄 Updating schema...');

        // Add script_content to agent_prompts if not exists
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_prompts' AND column_name = 'script_content') THEN 
                    ALTER TABLE agent_prompts ADD COLUMN script_content TEXT; 
                END IF; 
            END $$;
        `);
        console.log('✅ Added script_content to agent_prompts');

        console.log('🎉 Schema updated successfully!');
    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

updateSchema();
