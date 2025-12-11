const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function runMigration() {
    try {
        console.log('🔄 Adding slug column to chatbots table...');

        await pool.query(`
            ALTER TABLE chatbots 
            ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
        `);

        // Generate slugs for existing agents
        const agents = await pool.query('SELECT id, name FROM chatbots WHERE slug IS NULL');
        for (const agent of agents.rows) {
            let slug = agent.name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
                .replace(/^-+|-+$/g, ''); // Trim hyphens

            // Ensure uniqueness (simple append for now)
            let uniqueSlug = slug;
            let counter = 1;
            while (true) {
                try {
                    await pool.query('UPDATE chatbots SET slug = $1 WHERE id = $2', [uniqueSlug, agent.id]);
                    break;
                } catch (e) {
                    uniqueSlug = `${slug}-${counter++}`;
                }
            }
            console.log(`   Updated agent ${agent.name} -> ${uniqueSlug}`);
        }

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
