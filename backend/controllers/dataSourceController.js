const { Pool } = require('pg');
const axios = require('axios');
const db = require('../database');
const qdrantService = require('../services/qdrantService');

const dataSourceController = {
    // List all configured data sources
    listSources: async (req, res) => {
        try {
            const result = await db.query('SELECT id, name, type, is_active FROM data_sources WHERE is_active = true ORDER BY id');
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to list data sources' });
        }
    },

    // Introspect tables (Postgres) or collections (Qdrant)
    introspectSource: async (req, res) => {
        const { sourceId } = req.params;

        try {
            // 1. Get Source Config
            const sourceRes = await db.query('SELECT * FROM data_sources WHERE id = $1', [sourceId]);
            if (sourceRes.rows.length === 0) return res.status(404).json({ error: 'Source not found' });

            const source = sourceRes.rows[0];
            const config = source.connection_config;

            // 2. Postgres Introspection
            if (source.type === 'postgres') {
                const tempPool = new Pool({
                    connectionString: config.connectionString,
                    ssl: { rejectUnauthorized: false },
                    connectionTimeoutMillis: 5000
                });

                try {
                    const tables = await tempPool.query(`
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        ORDER BY table_name
                    `);

                    // Get columns for each table (optional optimization: fail fast)
                    // limit to just table names for now to be fast
                    res.json({
                        type: 'postgres',
                        items: tables.rows.map(r => r.table_name)
                    });
                } finally {
                    await tempPool.end();
                }
            }
            // 3. Qdrant Introspection
            else if (source.type === 'qdrant') {
                // Use centralized service (Source of Truth via Env Vars) 
                // instead of potentially stale DB credentials
                const result = await qdrantService.getCollections();

                if (result.success) {
                    res.json({
                        type: 'qdrant',
                        items: result.collections.map(c => c.name)
                    });
                } else {
                    throw new Error(result.error || 'Failed to fetch Qdrant collections from Service');
                }
            } else {
                res.status(400).json({ error: 'Unsupported source type' });
            }

        } catch (err) {
            console.error('Introspection Error:', err.message);
            res.status(500).json({ error: 'Failed to connect to source: ' + err.message });
        }
    }
};

module.exports = dataSourceController;
