const { opsPool: pool } = require('../database');

const templateController = {
    // === Template CRUD ===

    // Create a new template with items
    createTemplate: async (req, res) => {
        const client = await pool.connect();
        try {
            const { name, description, category, items } = req.body; // items = [{ title, description, duration_days, order_index }]

            await client.query('BEGIN');

            // 1. Insert Template
            const templateRes = await client.query(
                `INSERT INTO templates (name, description, category) VALUES ($1, $2, $3) RETURNING *`,
                [name, description, category]
            );
            const template = templateRes.rows[0];

            // 2. Insert Items (if any)
            if (items && items.length > 0) {
                for (const item of items) {
                    await client.query(
                        `INSERT INTO template_items (template_id, title, description, duration_days, order_index) 
             VALUES ($1, $2, $3, $4, $5)`,
                        [template.id, item.title, item.description, item.duration_days, item.order_index]
                    );
                }
            }

            await client.query('COMMIT');
            res.status(201).json(template);
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(err);
            res.status(500).json({ error: 'Failed to create template' });
        } finally {
            client.release();
        }
    },

    getAllTemplates: async (req, res) => {
        try {
            // Fetch templates
            const templates = await pool.query('SELECT * FROM templates WHERE is_active = true ORDER BY name');

            // Fetch item counts (optional optimization)
            // For now, just return templates. We can fetch items on detail view.
            res.json(templates.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch templates' });
        }
    },

    getTemplateDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const template = await pool.query('SELECT * FROM templates WHERE id = $1', [id]);

            if (template.rows.length === 0) {
                return res.status(404).json({ error: 'Template not found' });
            }

            const items = await pool.query(
                'SELECT * FROM template_items WHERE template_id = $1 ORDER BY order_index',
                [id]
            );

            res.json({ ...template.rows[0], items: items.rows });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch template details' });
        }
    },

    updateTemplate: async (req, res) => {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const { name, description, category, items } = req.body;

            await client.query('BEGIN');

            // 1. Update Template Metadata
            await client.query(
                `UPDATE templates SET name = $1, description = $2, category = $3 WHERE id = $4`,
                [name, description, category, id]
            );

            // 2. Sync Items (Full Replacement Strategy for simplicity)
            // Delete existing
            await client.query('DELETE FROM template_items WHERE template_id = $1', [id]);

            // Insert new
            if (items && items.length > 0) {
                for (const item of items) {
                    await client.query(
                        `INSERT INTO template_items (template_id, title, description, duration_days, order_index) 
             VALUES ($1, $2, $3, $4, $5)`,
                        [id, item.title, item.description || '', item.duration_days || 1, item.order_index || 0]
                    );
                }
            }

            await client.query('COMMIT');
            res.json({ message: 'Template updated successfully' });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(err);
            res.status(500).json({ error: 'Failed to update template' });
        } finally {
            client.release();
        }
    },

    deleteTemplate: async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('UPDATE templates SET is_active = false WHERE id = $1', [id]); // Soft delete
            res.json({ message: 'Template deleted' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to delete template' });
        }
    },

    // === Apply Logic ===

    applyTemplateToProject: async (req, res) => {
        const client = await pool.connect();
        try {
            const { id: projectId } = req.params; // Project ID
            const { templateId } = req.body;

            await client.query('BEGIN');

            // 1. Get Project Start Date (to calculate due dates)
            const projectRes = await client.query('SELECT start_date FROM projects WHERE id = $1', [projectId]);
            if (projectRes.rows.length === 0) throw new Error('Project not found');

            const startDate = new Date(projectRes.rows[0].start_date || new Date());

            // 2. Get Template Items
            const itemsRes = await client.query('SELECT * FROM template_items WHERE template_id = $1', [templateId]);
            const items = itemsRes.rows;

            // 3. Create Tasks
            for (const item of items) {
                // Calculate due date: start_date + duration_days
                const dueDate = new Date(startDate);
                dueDate.setDate(dueDate.getDate() + (item.duration_days || 1));

                await client.query(
                    `INSERT INTO tasks (project_id, title, description, status, due_date, priority)
             VALUES ($1, $2, $3, 'todo', $4, 'medium')`,
                    [projectId, item.title, item.description, dueDate]
                );
            }

            await client.query('COMMIT');
            res.json({ message: `Applied ${items.length} tasks from template` });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(err);
            res.status(500).json({ error: 'Failed to apply template' });
        } finally {
            client.release();
        }
    }
};

module.exports = templateController;
