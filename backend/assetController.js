const db = require('./database'); // Use Core DB (where assets live)
const storageService = require('./services/storageService');
const { getTenantScope } = require('./utils/tenantSecurity');

const assetController = {
    // --- FOLDERS ---

    listFolders: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { client_id, project_id, parent_id } = req.query;

        try {
            let query = `
                SELECT f.*, 
                       (SELECT COUNT(*) FROM asset_folders sub WHERE sub.parent_id = f.id) as subfolder_count,
                       (SELECT COUNT(*) FROM assets a WHERE a.folder_id = f.id) as file_count
                SELECT f.* FROM asset_folders f
                WHERE f.tenant_id = $1
            `;
            // Simplify query for now
            let sql = `
                SELECT f.*, 
                    (SELECT COUNT(*) FROM asset_folders sub WHERE sub.parent_id = f.id) as subfolder_count,
                    (SELECT COUNT(*) FROM assets a WHERE a.folder_id = f.id) as file_count
                FROM asset_folders f
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Tenant Scope
            // if (!isSuperAdmin) {
            //     sql += ` AND f.tenant_id = $${paramCount++}`;
            //     params.push(tenantId);
            // }

            // Parent ID (Navigation)
            if (parent_id && parent_id !== 'null') {
                sql += ` AND f.parent_id = $${paramCount++}`;
                params.push(parent_id);
            } else {
                sql += ` AND f.parent_id IS NULL`;
            }

            // Context Filter (Client vs Project vs Global)
            if (client_id) {
                sql += ` AND f.client_id = $${paramCount++}`;
                params.push(client_id);
            } else if (project_id) {
                sql += ` AND f.project_id = $${paramCount++}`;
                params.push(project_id);
            } else {
                // Root/Global folders (not specific to client/project)
                // sql += ` AND f.client_id IS NULL AND f.project_id IS NULL`;
            }

            sql += ` ORDER BY f.is_system DESC, f.name ASC`;

            const result = await db.query(sql, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error listing folders:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    createFolder: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { name, parent_id, client_id, project_id, color } = req.body;

        try {
            const result = await db.query(`
                INSERT INTO asset_folders (tenant_id, name, parent_id, client_id, project_id, color)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [tenantId, name, parent_id || null, client_id || null, project_id || null, color || '#cbd5e1']);

            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error creating folder:', error);
            res.status(500).json({ success: false, error: 'Failed to create folder' });
        }
    },

    deleteFolder: async (req, res) => {
        const { id } = req.params;
        try {
            // Check if folder is not system
            const check = await db.query('SELECT is_system FROM asset_folders WHERE id = $1', [id]);
            if (check.rows.length > 0 && check.rows[0].is_system) {
                return res.status(403).json({ success: false, error: 'Cannot delete system folders' });
            }

            await db.query('DELETE FROM asset_folders WHERE id = $1', [id]);
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting folder:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    // --- ASSETS ---

    listAssets: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { folder_id, search } = req.query;

        try {
            let sql = `SELECT * FROM assets WHERE 1=1`;
            const params = [];
            let paramCount = 1;

            // if (!isSuperAdmin) {
            //     sql += ` AND tenant_id = $${paramCount++}`;
            //     params.push(tenantId);
            // }

            if (folder_id && folder_id !== 'null') {
                sql += ` AND folder_id = $${paramCount++}`;
                params.push(folder_id);
            } else if (!search) {
                // If not searching and no folder, show unfiled assets? Or root?
                sql += ` AND folder_id IS NULL`;
            }

            if (search) {
                sql += ` AND name ILIKE $${paramCount++}`;
                params.push(`%${search}%`);
            }

            sql += ` ORDER BY created_at DESC`;

            const result = await db.query(sql, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error listing assets:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    uploadAsset: async (req, res) => {
        const { tenantId, id: userId } = req.user; // req.user populated by auth middleware
        const { folder_id, name, description } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        try {
            // 1. Upload to S3
            // Assuming file.buffer is available (memory storage)
            const s3Url = await storageService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                `tenants/${tenantId}/assets`
            );

            // 2. Save to DB
            const result = await db.query(`
                INSERT INTO assets (
                    tenant_id, folder_id, uploader_id, 
                    name, description, 
                    file_key, file_url, file_type, file_size
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                tenantId,
                folder_id === 'null' ? null : folder_id,
                userId,
                name || file.originalname,
                description || '',
                s3Url, // Key/URL simplification for now
                s3Url,
                file.mimetype,
                file.size
            ]);

            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error uploading asset:', error);
            res.status(500).json({ success: false, error: 'Upload failed' });
        }
    },

    deleteAsset: async (req, res) => {
        const { id } = req.params;

        try {
            // 1. Get File URL
            const assetRes = await db.query('SELECT file_url FROM assets WHERE id = $1', [id]);
            if (assetRes.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });

            const fileUrl = assetRes.rows[0].file_url;

            // 2. Delete from S3 (Async, don't block)
            storageService.deleteFile(fileUrl).catch(err => console.error('S3 Delete Error:', err));

            // 3. Delete from DB
            await db.query('DELETE FROM assets WHERE id = $1', [id]);

            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting asset:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    }
};

module.exports = assetController;
