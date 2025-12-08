const db = require('./db');

const mlConfigController = {
    // List all configs for tenant
    list: async (req, res) => {
        try {
            const tenantId = req.headers['x-tenant-id'] || null;

            const result = await db.query(`
                SELECT 
                    id, algorithm_id, algorithm_name, algorithm_category,
                    config, preset_name, is_default, is_active, description,
                    created_at, updated_at
                FROM ml_algorithm_configs
                WHERE (tenant_id = $1 OR tenant_id IS NULL)
                AND is_active = true
                ORDER BY algorithm_category, algorithm_name
            `, [tenantId]);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error listing ML configs:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get config for specific algorithm
    getByAlgorithm: async (req, res) => {
        try {
            const { algorithmId } = req.params;
            const tenantId = req.headers['x-tenant-id'] || null;

            const result = await db.query(`
                SELECT 
                    id, algorithm_id, algorithm_name, algorithm_category,
                    config, preset_name, is_default, is_active, description,
                    created_at, updated_at
                FROM ml_algorithm_configs
                WHERE algorithm_id = $1
                AND (tenant_id = $2 OR tenant_id IS NULL)
                AND is_active = true
                ORDER BY tenant_id NULLS LAST
                LIMIT 1
            `, [algorithmId, tenantId]);

            if (result.rows.length === 0) {
                return res.json({ success: true, data: null });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error getting ML config:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Save new config
    create: async (req, res) => {
        try {
            const tenantId = req.headers['x-tenant-id'] || null;
            const userId = req.headers['x-user-id'] || null;
            const {
                algorithm_id,
                algorithm_name,
                algorithm_category,
                config,
                preset_name,
                is_default,
                description
            } = req.body;

            // If setting as default, unset other defaults for this algorithm
            if (is_default) {
                await db.query(`
                    UPDATE ml_algorithm_configs
                    SET is_default = false
                    WHERE algorithm_id = $1 AND tenant_id = $2
                `, [algorithm_id, tenantId]);
            }

            const result = await db.query(`
                INSERT INTO ml_algorithm_configs (
                    tenant_id, algorithm_id, algorithm_name, algorithm_category,
                    config, preset_name, is_default, description, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                tenantId, algorithm_id, algorithm_name, algorithm_category,
                JSON.stringify(config), preset_name, is_default || false,
                description, userId
            ]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error creating ML config:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Update existing config
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const tenantId = req.headers['x-tenant-id'] || null;
            const userId = req.headers['x-user-id'] || null;
            const { config, preset_name, is_default, description } = req.body;

            // Get current config for history
            const currentResult = await db.query(
                'SELECT config FROM ml_algorithm_configs WHERE id = $1',
                [id]
            );

            if (currentResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Config not found' });
            }

            // Save to history
            await db.query(`
                INSERT INTO ml_algorithm_config_history (config_id, previous_config, new_config, changed_by)
                VALUES ($1, $2, $3, $4)
            `, [id, currentResult.rows[0].config, JSON.stringify(config), userId]);

            // If setting as default, unset others
            if (is_default) {
                const algorithmResult = await db.query(
                    'SELECT algorithm_id FROM ml_algorithm_configs WHERE id = $1',
                    [id]
                );
                if (algorithmResult.rows.length > 0) {
                    await db.query(`
                        UPDATE ml_algorithm_configs
                        SET is_default = false
                        WHERE algorithm_id = $1 AND tenant_id = $2 AND id != $3
                    `, [algorithmResult.rows[0].algorithm_id, tenantId, id]);
                }
            }

            // Update config
            const result = await db.query(`
                UPDATE ml_algorithm_configs
                SET config = $1, preset_name = $2, is_default = $3, description = $4
                WHERE id = $5
                RETURNING *
            `, [JSON.stringify(config), preset_name, is_default || false, description, id]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error updating ML config:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Delete config (soft delete)
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            await db.query(`
                UPDATE ml_algorithm_configs
                SET is_active = false
                WHERE id = $1
            `, [id]);

            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting ML config:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get Brazilian holidays for Prophet
    getHolidays: async (req, res) => {
        try {
            const tenantId = req.headers['x-tenant-id'] || null;

            const result = await db.query(`
                SELECT 
                    id, holiday_name, holiday_date, lower_window, upper_window, is_recurring
                FROM ml_prophet_holidays
                WHERE tenant_id IS NULL OR tenant_id = $1
                ORDER BY holiday_date
            `, [tenantId]);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error getting holidays:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Add custom holiday
    addHoliday: async (req, res) => {
        try {
            const tenantId = req.headers['x-tenant-id'] || null;
            const { holiday_name, holiday_date, lower_window, upper_window, is_recurring } = req.body;

            const result = await db.query(`
                INSERT INTO ml_prophet_holidays (
                    tenant_id, holiday_name, holiday_date, lower_window, upper_window, is_recurring
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [tenantId, holiday_name, holiday_date, lower_window || 0, upper_window || 0, is_recurring !== false]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error adding holiday:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get config history
    getHistory: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await db.query(`
                SELECT 
                    h.id, h.previous_config, h.new_config, h.changed_at,
                    u.name as changed_by_name
                FROM ml_algorithm_config_history h
                LEFT JOIN users u ON h.changed_by = u.id
                WHERE h.config_id = $1
                ORDER BY h.changed_at DESC
                LIMIT 20
            `, [id]);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error getting config history:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = mlConfigController;
