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
        // Handle NULL tenant_id
        let whereClause = tenantId ? `p.tenant_id = $1` : `p.tenant_id IS NULL`;
        let params = tenantId ? [tenantId] : [];

        let query = `
            SELECT p.*, 
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as completed_tasks
            FROM projects p
            WHERE ${whereClause}
        `;

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
        const {
            name, description, status, start_date, end_date, client_id, priority, budget, owner_id,
            // New Fields
            marketing_objectives, target_audience, value_proposition, brand_positioning,
            marketing_channels, timeline_activities, dependencies, key_milestones,
            team_structure, tools_platforms, external_suppliers, creative_assets,
            kpis, goals, analysis_tools, reporting_frequency,
            budget_media, budget_production, budget_contingency, budget_breakdown,
            risks, mitigation_plan,
            approval_status, creative_brief_link, assets_link
        } = req.body;

        const result = await opsPool.query(
            `INSERT INTO projects (
                tenant_id, name, description, client_id, owner_id, status, priority, 
                start_date, end_date, budget,
                marketing_objectives, target_audience, value_proposition, brand_positioning,
                marketing_channels, timeline_activities, dependencies, key_milestones,
                team_structure, tools_platforms, external_suppliers, creative_assets,
                kpis, goals, analysis_tools, reporting_frequency,
                budget_media, budget_production, budget_contingency, budget_breakdown,
                risks, mitigation_plan,
                approval_status, creative_brief_link, assets_link
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, 
                $8, $9, $10,
                $11, $12, $13, $14,
                $15, $16, $17, $18,
                $19, $20, $21, $22,
                $23, $24, $25, $26,
                $27, $28, $29, $30,
                $31, $32,
                $33, $34, $35
            )
            RETURNING *`,
            [
                tenantId, name, description, client_id || null, owner_id || req.user.id, status || 'planning', priority || 'medium',
                start_date || null, end_date || null, budget || 0,
                marketing_objectives, target_audience, value_proposition, brand_positioning,
                JSON.stringify(marketing_channels || []), timeline_activities, dependencies, JSON.stringify(key_milestones || []),
                JSON.stringify(team_structure || []), tools_platforms, external_suppliers, creative_assets,
                kpis, goals, analysis_tools, reporting_frequency,
                budget_media || 0, budget_production || 0, budget_contingency || 0, JSON.stringify(budget_breakdown || {}),
                risks, mitigation_plan,
                approval_status || 'pending', creative_brief_link, assets_link
            ]
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
        const whereClause = tenantId ? `p.id = $1 AND p.tenant_id = $2` : `p.id = $1 AND p.tenant_id IS NULL`;
        const params = tenantId ? [id, tenantId] : [id];

        const result = await opsPool.query(
            `SELECT p.* FROM projects p WHERE ${whereClause}`,
            params
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
            if ([
                'name', 'description', 'status', 'start_date', 'end_date', 'client_id', 'priority', 'budget', 'owner_id', 'settings',
                // New Fields
                'marketing_objectives', 'target_audience', 'value_proposition', 'brand_positioning',
                'marketing_channels', 'timeline_activities', 'dependencies', 'key_milestones',
                'team_structure', 'tools_platforms', 'external_suppliers', 'creative_assets',
                'kpis', 'goals', 'analysis_tools', 'reporting_frequency',
                'budget_media', 'budget_production', 'budget_contingency', 'budget_breakdown',
                'risks', 'mitigation_plan',
                'approval_status', 'creative_brief_link', 'assets_link'
            ].includes(key)) {
                fields.push(`${key} = $${idx}`);
                // Handle JSON fields if passed as object
                if (['marketing_channels', 'key_milestones', 'team_structure', 'budget_breakdown'].includes(key)) {
                    values.push(JSON.stringify(updates[key]));
                } else {
                    values.push(updates[key]);
                }
                idx++;
            }
        });

        if (fields.length === 0) return res.json({ message: 'No updates provided' });

        values.push(id);
        const whereClause = tenantId ? `id = $${idx} AND tenant_id = $${idx + 1}` : `id = $${idx} AND tenant_id IS NULL`;
        if (tenantId) values.push(tenantId);

        const query = `
            UPDATE projects 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE ${whereClause}
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

        const whereClause = tenantId ? `id = $1 AND tenant_id = $2` : `id = $1 AND tenant_id IS NULL`;
        const params = tenantId ? [id, tenantId] : [id];

        const result = await opsPool.query(
            `DELETE FROM projects WHERE ${whereClause} RETURNING id`,
            params
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

