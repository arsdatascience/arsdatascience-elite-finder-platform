const { secondaryPool } = require('../database');

/**
 * List all public tables from the secondary database.
 */
exports.getTables = async (req, res) => {
    try {
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;
        const result = await secondaryPool.query(query);
        res.json({ tables: result.rows.map(r => r.table_name) });
    } catch (error) {
        console.error('Error fetching tables from secondary DB:', error);
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
};

/**
 * Get schema and sample data for a specific table.
 */
exports.getTableDetails = async (req, res) => {
    const { tableName } = req.params;

    // Basic SQL Injection prevention: ensure tableName only contains safe characters
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        return res.status(400).json({ error: 'Invalid table name' });
    }

    try {
        // 1. Get Columns
        const schemaQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1;
        `;
        const schemaRes = await secondaryPool.query(schemaQuery, [tableName]);

        // 2. Get Sample Data (Limit 5)
        const dataQuery = `SELECT * FROM "${tableName}" LIMIT 5`;
        const dataRes = await secondaryPool.query(dataQuery);

        res.json({
            tableName,
            columns: schemaRes.rows,
            sampleData: dataRes.rows
        });
    } catch (error) {
        console.error(`Error fetching details for table ${tableName}:`, error);
        res.status(500).json({ error: 'Failed to fetch table details' });
    }
};
