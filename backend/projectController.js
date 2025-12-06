const db = require('./database');
const corePool = db;
const opsPool = db.opsPool;

// --- PROJECTS ---

// List Projects (Tenant Scoped)
exports.getProjects = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { status, owner_id } = req.query;

        // 1. Fetch Projects from Ops DB (No Joins to Core Tables)
        let query = `
            SELECT p.*, 
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as completed_tasks
            FROM projects p
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

        const result = await opsPool.query(query, params);
        const projects = result.rows;

        if (projects.length === 0) {
            return res.json([]);
        }

        // 2. Extract IDs for Core DB enrichment
        const ownerIds = [...new Set(projects.map(p => p.owner_id).filter(id => id))];
        const clientIds = [...new Set(projects.map(p => p.client_id).filter(id => id))];

        // 3. Fetch Data from Core DB
        let owners = [];
        let clients = [];

        if (ownerIds.length > 0) {
            const usersRes = await corePool.query(
                `SELECT id, name FROM users WHERE id = ANY($1)`,
                [ownerIds]
            );
            owners = usersRes.rows;
        }

        if (clientIds.length > 0) {
            const clientsRes = await corePool.query(
                `SELECT id, name FROM clients WHERE id = ANY($1)`,
                [clientIds]
            );
            clients = clientsRes.rows;
        }

        // 4. Merge Data
        const enrichedProjects = projects.map(p => {
            const owner = owners.find(u => u.id === p.owner_id);
            const client = clients.find(c => c.id === p.client_id);
            return {
                ...p,
                owner_name: owner ? owner.name : 'Unknown',
                client_name: client ? client.name : null
            };
        });

        res.json(enrichedProjects);
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

        const result = await opsPool.query(
            `INSERT INTO projects 
            (tenant_id, name, description, status, start_date, end_date, client_id, priority, budget, owner_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [tenantId, name, description, status || 'planning', start_date, end_date, client_id, priority, budget, owner_id || req.user.id]
        );

        // Add creator as member automatically
        await opsPool.query(
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

        // 1. Fetch Project from Ops DB
        const result = await opsPool.query(
            `SELECT p.* FROM projects p WHERE p.id = $1 AND p.tenant_id = $2`,
            [id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = result.rows[0];

        // 2. Fetch Owner and Client from Core DB
        let owner_name = 'Unknown';
        let client_name = null;

        if (project.owner_id) {
            const userRes = await corePool.query(`SELECT name FROM users WHERE id = $1`, [project.owner_id]);
            if (userRes.rows.length > 0) owner_name = userRes.rows[0].name;
        }

        if (project.client_id) {
            const clientRes = await corePool.query(`SELECT name FROM clients WHERE id = $1`, [project.client_id]);
            if (clientRes.rows.length > 0) client_name = clientRes.rows[0].name;
        }

        res.json({ ...project, owner_name, client_name });
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

        const result = await opsPool.query(query, values);

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

        const result = await opsPool.query(
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
