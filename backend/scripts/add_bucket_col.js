const db = require('../database').opsPool;

async function run() {
    console.log('🔄 Adding bucket column to asset_folders...');
    try {
        await db.query(`
            ALTER TABLE asset_folders 
            ADD COLUMN IF NOT EXISTS bucket VARCHAR(255);
        `);
        console.log('✅ Column added successfully.');
    } catch (error) {
        console.error('❌ Error adding column:', error);
    } finally {
        // We can't easily close the pool if it's exported as a singleton without end method exposure, 
        // but process exit will handle it.
        process.exit();
    }
}

run();
