const { opsPool } = require('../database');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('exceljs');

const uploadDataset = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { originalname, size, filename, path: filePath } = req.file;
        const tenantId = req.user.tenantId; // From auth middleware
        const clientId = req.body.clientId || null;
        const description = req.body.description || '';
        const name = req.body.name || originalname;

        let rowCount = 0;
        let columns = [];
        let preview = [];

        // Parse file based on type to get metadata
        const ext = path.extname(originalname).toLowerCase();
        let fileType = ext.replace('.', '');

        if (ext === '.csv') {
            await new Promise((resolve, reject) => {
                const results = [];
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('headers', (headers) => {
                        columns = headers.map(h => ({ name: h, type: 'string' })); // Basic detection
                    })
                    .on('data', (data) => {
                        if (results.length < 100) results.push(data);
                        rowCount++;
                    })
                    .on('end', () => {
                        preview = results;
                        resolve();
                    })
                    .on('error', reject);
            });
        }
        // TODO: Add XLSX support here if needed via stream or full load

        const result = await opsPool.query(
            `INSERT INTO datasets 
            (tenant_id, client_id, name, description, file_name, file_type, file_size, file_path, row_count, column_count, columns, preview, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'validated')
            RETURNING *`,
            [tenantId, clientId, name, description, originalname, fileType, size, filePath, rowCount, columns.length, JSON.stringify(columns), JSON.stringify(preview)]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to process upload' });
    }
};

const getDatasets = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const result = await opsPool.query(
            'SELECT * FROM datasets WHERE tenant_id = $1 ORDER BY created_at DESC',
            [tenantId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch datasets' });
    }
};

module.exports = {
    uploadDataset,
    getDatasets
};
