const db = require('./database');
const corePool = db;
const opsPool = db.opsPool;

// --- TASKS ---

// List Tasks (Project or Global)
// List Tasks (Project or Global)
exports.getTasks = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const {
            project_id, assignee_id, status,
            workspace, channel, stage, squad, tags, task_type, origin, priority
        } = req.query;

        // 1. Fetch Tasks from Ops DB
        let query = `
            SELECT t.*, 
                   p.name as project_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE t.tenant_id = $1
        `;
        const params = [tenantId];

        if (project_id) { params.push(project_id); query += ` AND t.project_id = $${params.length}`; }
        if (assignee_id) { params.push(assignee_id); query += ` AND t.assignee_id = $${params.length}`; }
        if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }

        // New Filters
        if (workspace) { params.push(workspace); query += ` AND t.workspace = $${params.length}`; }
        if (channel) { params.push(channel); query += ` AND t.channel = $${params.length}`; }
        if (stage) { params.push(stage); query += ` AND t.stage = $${params.length}`; }
        if (squad) { params.push(squad); query += ` AND t.squad = $${params.length}`; }
        if (task_type) { params.push(task_type); query += ` AND t.task_type = $${params.length}`; }
        if (origin) { params.push(origin); query += ` AND t.origin = $${params.length}`; }
        if (priority) { params.push(priority); query += ` AND t.priority = $${params.length}`; }

        if (tags) {
            // Assuming tags is passed as comma-separated string if multiple
            const tagArray = tags.split(',').map(t => t.trim());
            params.push(tagArray);
            query += ` AND t.tags && $${params.length}`; // Overlap operator
        }

        // Order by column_order for Kanban, then recently created
        query += ` ORDER BY t.column_order ASC, t.created_at DESC`;

        const result = await opsPool.query(query, params);
        const tasks = result.rows;

        if (tasks.length === 0) {
            return res.json([]);
        }

        // 2. Extract Assignee IDs (Logic Unchanged)
        const assigneeIds = [...new Set(tasks.map(t => t.assignee_id).filter(id => id))];

        // 3. Fetch Assignees from Core DB
        let assignees = [];
        if (assigneeIds.length > 0) {
            const usersRes = await corePool.query(
                `SELECT id, name, avatar_url FROM users WHERE id = ANY($1)`,
                [assigneeIds]
            );
            assignees = usersRes.rows;
        }

        // 4. Merge Data
        const enrichedTasks = tasks.map(t => {
            const assignee = assignees.find(u => u.id === t.assignee_id);
            return {
                ...t,
                assignee_name: assignee ? assignee.name : null,
                assignee_avatar: assignee ? assignee.avatar_url : null
            };
        });

        res.json(enrichedTasks);
    } catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

// Create Task
exports.createTask = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const {
            project_id, title, description, status, priority,
            assignee_id, due_date, estimated_minutes, tags, column_order,
            // New Fields (026 & 028)
            workspace, channel, stage, stage_due_date, effort_time, origin, squad, task_type, campaign_plan, project_manager_id,
            // Detailed Fields (028)
            reference_code, start_date,
            collaborators_ids, approvers_ids, stakeholders_ids,
            percent_complete, checklist,
            deliverable_format, technical_specs, brand_guidelines,
            dependency_ids, blockers,
            briefing_link, visual_references, support_materials,
            final_delivery_link, performance_metrics, feedback
        } = req.body;

        const result = await opsPool.query(
            `INSERT INTO tasks (
                tenant_id, project_id, title, description, status, priority, 
                assignee_id, reporter_id, due_date, estimated_minutes, tags, column_order,
                workspace, channel, stage, stage_due_date, effort_time, origin, squad, task_type, campaign_plan, created_by, project_manager_id,
                reference_code, start_date,
                collaborators_ids, approvers_ids, stakeholders_ids,
                percent_complete, checklist,
                deliverable_format, technical_specs, brand_guidelines,
                dependency_ids, blockers,
                briefing_link, visual_references, support_materials,
                final_delivery_link, performance_metrics, feedback
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, 
                $7, $8, $9, $10, $11, $12, 
                $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
                $24, $25,
                $26, $27, $28,
                $29, $30,
                $31, $32, $33,
                $34, $35,
                $36, $37, $38,
                $39, $40, $41
            )
            RETURNING *`,
            [
                tenantId, project_id, title, description,
                status || 'todo', priority || 'medium',
                assignee_id, req.user.id, due_date,
                estimated_minutes || 0, tags || [], column_order || 0,
                workspace, channel, stage, stage_due_date, effort_time, origin, squad, task_type, campaign_plan, req.user.id, project_manager_id,
                reference_code, start_date,
                collaborators_ids || [], approvers_ids || [], stakeholders_ids || [],
                percent_complete || 0, JSON.stringify(checklist || []),
                deliverable_format, technical_specs, brand_guidelines,
                dependency_ids || [], blockers,
                briefing_link, visual_references, support_materials,
                final_delivery_link, JSON.stringify(performance_metrics || {}), feedback
            ]
        );

        const task = result.rows[0];

        // --- BRAIN INTEGRATION HOOK ---
        // Placeholder: In future, this will emit an event to the AI Agent to index this task
        // e.g., eventBus.emit('system.brain.index_task', { task });
        console.log(`🧠 Elite Brain: Task ${task.id} (${task.title}) indexed for context.`);
        // ------------------------------

        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

// Update Task (Status, Drag & Drop, Details)
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;
        const updates = req.body;

        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = [
            'title', 'description', 'status', 'priority', 'assignee_id', 'due_date', 'estimated_minutes', 'tags', 'column_order', 'completed_at',
            // 026 Fields
            'workspace', 'channel', 'stage', 'stage_due_date', 'effort_time', 'origin', 'squad', 'task_type', 'campaign_plan', 'project_manager_id', 'delayed_stage', 'completed_but_late',
            // 028 Detailed Fields
            'reference_code', 'start_date',
            'collaborators_ids', 'approvers_ids', 'stakeholders_ids',
            'percent_complete', 'checklist',
            'deliverable_format', 'technical_specs', 'brand_guidelines',
            'dependency_ids', 'blockers',
            'briefing_link', 'visual_references', 'support_materials',
            'final_delivery_link', 'performance_metrics', 'feedback'
        ];

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = $${idx}`);

                // Handle JSON fields
                if (['checklist', 'performance_metrics'].includes(key)) {
                    values.push(JSON.stringify(updates[key]));
                }
                // Handle Array fields (Postgres requires array literals or params, node-pg handles arrays natively usually but let's be safe)
                // node-pg handles [1,2,3] -> '{1,2,3}' automatically for int[] columns
                else {
                    values.push(updates[key]);
                }

                idx++;
            }
        });

        if (fields.length === 0) return res.json({ message: 'No updates provided' });

        values.push(id);
        values.push(tenantId);

        const query = `
            UPDATE tasks 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${idx} AND tenant_id = $${idx + 1}
            RETURNING *
        `;

        const result = await opsPool.query(query, values);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

        // --- BRAIN INTEGRATION HOOK (Update) ---
        if (Object.keys(updates).length > 2) { // only if meaningful update
            console.log(`🧠 Elite Brain: Task ${id} updated context.`);
        }
        // ---------------------------------------

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Delete Task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;

        await opsPool.query('DELETE FROM tasks WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

// Update KanBan Order (Batch)
exports.updateOrder = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { tasks } = req.body; // Array of { id, column_order, status }

        // Use a transaction for batch updates
        const client = await opsPool.connect();
        try {
            await client.query('BEGIN');

            for (const task of tasks) {
                await client.query(
                    `UPDATE tasks SET column_order = $1, status = $2 
                     WHERE id = $3 AND tenant_id = $4`,
                    [task.column_order, task.status, task.id, tenantId]
                );
            }

            await client.query('COMMIT');
            res.json({ success: true });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error reordering tasks:', error);
        res.status(500).json({ error: 'Failed to reorder' });
    }
};
