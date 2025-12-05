const pool = require('./database');
const storageService = require('./services/storageService');
const fs = require('fs');

/**
 * List assets (files) with optional filtering by folder, project, or client
 */
exports.listAssets = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { folder_id, project_id, client_id, search } = req.query;

        let query = `
            SELECT a.*, u.name as uploader_name
            FROM assets a
            LEFT JOIN users u ON a.uploader_id = u.id
            WHERE a.tenant_id = $1
        `;
        const params = [tenantId];
        let paramIndex = 2;

        if (folder_id) {
            query += ` AND a.folder_id = $${paramIndex}`;
            params.push(folder_id);
            paramIndex++;
        } else if (project_id) {
            // If filtering by project but no specific folder, showing root project assets?
            // Actually, usually we filter by folder. If project_id is passed, we might want to find folders for that project.
            // But let's assume assets can be directly linked or we filter by folders linked to project.
            // FOR NOW: Direct filter if column exists, or ignored if logic differs.
            // Since schema has project_id in FOLDERS, not ASSETS directly (assets are in folders), 
            // we should probably filter by folders that belong to the project.
        }

        if (search) {
            query += ` AND a.name ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY a.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error listing assets:', error);
        res.status(500).json({ error: 'Failed to list assets' });
    }
};

/**
 * List folders (hierarchical)
 */
exports.listFolders = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { parent_id, project_id, client_id } = req.query;

        let query = `SELECT * FROM asset_folders WHERE tenant_id = $1`;
        const params = [tenantId];
        let paramIndex = 2;

        if (parent_id) {
            query += ` AND parent_id = $${paramIndex}`;
            params.push(parent_id);
            paramIndex++;
        } else {
            query += ` AND parent_id IS NULL`; // Root folders
        }

        if (project_id) {
            query += ` AND project_id = $${paramIndex}`;
            params.push(project_id);
            paramIndex++;
        } else if (client_id) {
            query += ` AND client_id = $${paramIndex}`;
            params.push(client_id);
            paramIndex++;
        }

        query += ` ORDER BY name ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error listing folders:', error);
        res.status(500).json({ error: 'Failed to list folders' });
    }
};

/**
 * Create a new folder
 */
exports.createFolder = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { name, parent_id, project_id, client_id } = req.body;

        const result = await pool.query(
            `INSERT INTO asset_folders (tenant_id, name, parent_id, project_id, client_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [tenantId, name, parent_id, project_id, client_id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
};

/**
 * Upload a file (Asset)
 * Expects 'file' to be present in req (multer)
 */
exports.uploadAsset = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        const { folder_id, name, description } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to S3
        const fileUrl = await storageService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            `tenant_${tenantId}/assets`
        );

        // Save to DB
        const result = await pool.query(
            `INSERT INTO assets (tenant_id, folder_id, uploader_id, name, description, file_key, file_url, file_type, file_size)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                tenantId,
                folder_id || null,
                userId,
                name || file.originalname,
                description || '',
                fileUrl.split('/').pop(), // Key (simplified)
                fileUrl,
                file.mimetype,
                file.size
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error uploading asset:', error);
        res.status(500).json({ error: 'Failed to upload asset' });
    }
};

/**
 * Delete asset
 */
exports.deleteAsset = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { id } = req.params;

        // Get asset first to get URL
        const assetResult = await pool.query(
            `SELECT * FROM assets WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );

        if (assetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        const asset = assetResult.rows[0];

        // Delete from S3
        await storageService.deleteFile(asset.file_url);

        // Delete from DB
        await pool.query(`DELETE FROM assets WHERE id = $1`, [id]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
};
