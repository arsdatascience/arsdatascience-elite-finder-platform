require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/db');

const checkDuplicateCategories = async () => {
    try {
        console.log('🔍 Checking for duplicate categories...');

        const res = await db.query(`
            SELECT name, type, COUNT(*) as count, array_agg(id) as ids
            FROM financial_categories
            GROUP BY name, type
            HAVING COUNT(*) > 1
        `);

        if (res.rows.length === 0) {
            console.log('✅ No duplicate categories found.');
        } else {
            console.log(`⚠️ Found ${res.rows.length} duplicated category names:`);
            res.rows.forEach(row => {
                console.log(`- ${row.name} (${row.type}): ${row.count} times (IDs: ${row.ids.join(', ')})`);
            });

            console.log('\n🧹 Cleaning up duplicates...');

            for (const row of res.rows) {
                const ids = row.ids;
                // Keep the first one (usually the oldest or default), delete others
                // But first, we need to update transactions to point to the one we keep
                const keepId = ids[0];
                const removeIds = ids.slice(1);

                console.log(`  Processing '${row.name}': Keeping ID ${keepId}, removing IDs ${removeIds.join(', ')}`);

                // Update transactions
                await db.query(`
                    UPDATE financial_transactions 
                    SET category_id = $1 
                    WHERE category_id = ANY($2::int[])
                `, [keepId, removeIds]);

                // Delete duplicates
                await db.query(`
                    DELETE FROM financial_categories 
                    WHERE id = ANY($1::int[])
                `, [removeIds]);
            }
            console.log('✅ Cleanup complete!');
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkDuplicateCategories();
