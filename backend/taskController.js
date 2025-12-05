const pool = require('./database');

// --- TASKS ---

// List Tasks (Project or Global)
exports.getTasks = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { project_id, assignee_id, status } = req.query;

        let query = `
            SELECT t.*, 
                   p.name as project_name,
                   u.name as assignee_name,
                   u.avatar_url as assignee_avatar
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE t.tenant_id = $1
        `;
        const params = [tenantId];

        if (project_id) {
            query += ` AND t.project_id = $${params.length + 1}`;
            params.push(project_id);
        }

        if (assignee_id) {
            query += ` AND t.assignee_id = $${params.length + 1}`;
            params.push(assignee_id);
        }

        if (status) {
            query += ` AND t.status = $${params.length + 1}`;
            params.push(status);
        }

        // Order by column_order for Kanban, then recently created
        query += ` ORDER BY t.column_order ASC, t.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
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
            assignee_id, due_date, estimated_minutes, tags, column_order
        } = req.body;

        const result = await pool.query(
            `INSERT INTO tasks 
            (tenant_id, project_id, title, description, status, priority, assignee_id, reporter_id, due_date, estimated_minutes, tags, column_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                tenantId, project_id, title, description,
                status || 'todo', priority || 'medium',
                assignee_id, req.user.id, due_date,
                estimated_minutes || 0, tags || [], column_order || 0
            ]
        );

        // Log formatted result for frontend update
        const task = result.rows[0];
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

        Object.keys(updates).forEach(key => {
            if (['title', 'description', 'status', 'priority', 'assignee_id', 'due_date', 'estimated_minutes', 'tags', 'column_order', 'completed_at'].includes(key)) {
                fields.push(`${key} = $${idx}`);
                values.push(updates[key]);
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

        const result = await pool.query(query, values);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

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

        await pool.query('DELETE FROM tasks WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
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
        const client = await pool.connect();
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
