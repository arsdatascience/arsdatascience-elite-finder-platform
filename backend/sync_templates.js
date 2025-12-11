require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

// Manually setup pools to ensure we don't rely on database.js logic which might be confusing environments
const opsPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL });
const corePool = new Pool({ connectionString: process.env.DATABASE_URL });

async function sync() {
    try {
        console.log('🔄 Syncing Templates from Ops DB -> Core DB...');

        // 1. Get from Ops
        const templatesRes = await opsPool.query('SELECT * FROM templates');
        const templates = templatesRes.rows;
        console.log(`Found ${templates.length} templates in Ops DB.`);

        if (templates.length === 0) {
            console.log('No templates to sync.');
            return;
        }

        // 2. Clear Core (optional, or just upsert) - let's upsert or careful insert
        // For simplicity, we'll INSERT assuming empty or handle duplicates

        for (const t of templates) {
            // Check if exists
            const check = await corePool.query('SELECT id FROM templates WHERE id = $1', [t.id]);
            if (check.rows.length > 0) {
                // Update? Or skip. Skip for now to avoid overwriting user changes if any.
                // Actually, user says "vazio", so likely empty.
                console.log(`Template ${t.id} exists in Core. Skipping.`);
                continue;
            }

            console.log(`Inserting Template ${t.id}: ${t.name}`);
            await corePool.query(
                `INSERT INTO templates (id, name, description, category, is_active, created_at, updated_at)
                  VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [t.id, t.name, t.description, t.category, t.is_active, t.created_at, t.updated_at]
            );

            // Items
            const itemsRes = await opsPool.query('SELECT * FROM template_items WHERE template_id = $1', [t.id]);
            for (const item of itemsRes.rows) {
                await corePool.query(
                    `INSERT INTO template_items (id, template_id, title, description, duration_days, order_index, created_at, updated_at)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [item.id, item.template_id, item.title, item.description, item.duration_days, item.order_index, item.created_at, item.updated_at]
                );
            }
        }

        console.log('✅ Sync complete!');

    } catch (e) {
        console.error('❌ Sync failed:', e);
    } finally {
        await opsPool.end();
        await corePool.end();
    }
}

sync();
