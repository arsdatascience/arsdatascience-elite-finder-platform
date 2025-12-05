const pool = require('./database');

// --- PROJECTS ---

// List Projects (Tenant Scoped)
exports.getProjects = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { status, owner_id } = req.query;

        let query = `
            SELECT p.*, 
                   u.name as owner_name,
                   c.name as client_name,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as completed_tasks
            FROM projects p
            LEFT JOIN users u ON p.owner_id = u.id
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE p.tenant_id = $1
        `;
        const params = [tenantId];

        if (status) {
            query += ` AND p.status = $${params.length + 1}`;
            params.push(status);
        }

        if (owner_id) {
            query += ` AND p.owner_id = $${params.length + 1}`;
            params.push(owner_id);
        }

        query += ` ORDER BY p.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

// Create Project
exports.createProject = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { name, description, status, start_date, end_date, client_id, priority, budget, owner_id } = req.body;

        const result = await pool.query(
            `INSERT INTO projects 
            (tenant_id, name, description, status, start_date, end_date, client_id, priority, budget, owner_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [tenantId, name, description, status || 'planning', start_date, end_date, client_id, priority, budget, owner_id || req.user.id]
        );

        // Add creator as member automatically
        await pool.query(
            `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'manager')`,
            [result.rows[0].id, req.user.id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
};

// Get Single Project details
exports.getProject = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;

        const result = await pool.query(
            `SELECT p.*, 
                    u.name as owner_name,
                    c.name as client_name
             FROM projects p
             LEFT JOIN users u ON p.owner_id = u.id
             LEFT JOIN clients c ON p.client_id = c.id
             WHERE p.id = $1 AND p.tenant_id = $2`,
            [id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};

// Update Project
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;
        const updates = req.body;

        // Dynamic update query
        const fields = [];
        const values = [];
        let idx = 1;

        Object.keys(updates).forEach(key => {
            if (['name', 'description', 'status', 'start_date', 'end_date', 'client_id', 'priority', 'budget', 'owner_id', 'settings'].includes(key)) {
                fields.push(`${key} = $${idx}`);
                values.push(updates[key]);
                idx++;
            }
        });

        if (fields.length === 0) return res.json({ message: 'No updates provided' });

        values.push(id);
        values.push(tenantId);

        const query = `
            UPDATE projects 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${idx} AND tenant_id = $${idx + 1}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

// Delete Project
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id; // Check tenant ownership

        const result = await pool.query(
            'DELETE FROM projects WHERE id = $1 AND tenant_id = $2 RETURNING id',
            [id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};
