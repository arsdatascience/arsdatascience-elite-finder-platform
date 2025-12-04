const db = require('./db');
const { syncCampaignCosts } = require('./jobs/financialSync');

const financialController = {
    // --- TRANSACTIONS ---

    getTransactions: async (req, res) => {
        const { tenant_id, role } = req.user;
        const isSuperAdmin = role === 'super_admin' || role === 'Super Admin' || role === 'super_user';
        const { startDate, endDate, type, status, category_id, client_id } = req.query;

        try {
            let query = `
                SELECT t.*, 
                       c.name as category_name, c.color as category_color,
                       s.name as supplier_name,
                       cl.name as client_name,
                       u.name as user_name
                FROM financial_transactions t
                LEFT JOIN financial_categories c ON t.category_id = c.id
                LEFT JOIN suppliers s ON t.supplier_id = s.id
                LEFT JOIN clients cl ON t.client_id = cl.id
                LEFT JOIN users u ON t.user_id = u.id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (!isSuperAdmin && tenant_id) {
                query += ` AND t.tenant_id = $${paramCount++}`;
                params.push(tenant_id);
            }

            if (startDate) {
                query += ` AND t.date >= $${paramCount++}`;
                params.push(startDate);
            }
            if (endDate) {
                query += ` AND t.date <= $${paramCount++}`;
                params.push(endDate);
            }
            if (type) {
                query += ` AND t.type = $${paramCount++}`;
                params.push(type);
            }
            if (status) {
                query += ` AND t.status = $${paramCount++}`;
                params.push(status);
            }
            if (category_id) {
                query += ` AND t.category_id = $${paramCount++}`;
                params.push(category_id);
            }
            if (client_id) {
                query += ` AND t.client_id = $${paramCount++}`;
                params.push(client_id);
            }

            query += ` ORDER BY t.date DESC, t.created_at DESC`;

            const result = await db.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching transactions:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    createTransaction: async (req, res) => {
        const { tenant_id, id: user_id } = req.user;
        const {
            description, amount, type, category_id, supplier_id,
            campaign_id, client_id, related_user_id,
            date, due_date, payment_date, status, payment_method, notes
        } = req.body;

        try {
            const result = await db.query(`
                INSERT INTO financial_transactions (
                    tenant_id, description, amount, type, category_id, supplier_id,
                    campaign_id, client_id, user_id,
                    date, due_date, payment_date, "status", payment_method, notes, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `, [
                tenant_id, description, amount, type, category_id || null, supplier_id || null,
                campaign_id || null, client_id || null, related_user_id || null,
                date, due_date || null, payment_date || null, status || 'pending', payment_method, notes, user_id
            ]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error creating transaction:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    updateTransaction: async (req, res) => {
        const { id } = req.params;
        const {
            description, amount, type, category_id, supplier_id,
            campaign_id, client_id, related_user_id,
            date, due_date, payment_date, status, payment_method, notes
        } = req.body;

        try {
            const result = await db.query(`
                UPDATE financial_transactions SET
                    description=$1, amount=$2, type=$3, category_id=$4, supplier_id=$5,
                    campaign_id=$6, client_id=$7, user_id=$8,
                    date=$9, due_date=$10, payment_date=$11, "status"=$12, payment_method=$13, notes=$14,
                    updated_at=NOW()
                WHERE id=$15
                RETURNING *
            `, [
                description, amount, type, category_id || null, supplier_id || null,
                campaign_id || null, client_id || null, related_user_id || null,
                date, due_date || null, payment_date || null, status, payment_method, notes,
                id
            ]);

            if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Transaction not found' });
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error updating transaction:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    deleteTransaction: async (req, res) => {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM financial_transactions WHERE id = $1', [id]);
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting transaction:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    // --- DASHBOARD & ANALYTICS ---

    getFinancialDashboard: async (req, res) => {
        const { tenant_id, role } = req.user;
        const isSuperAdmin = role === 'super_admin' || role === 'Super Admin' || role === 'super_user';
        const { startDate, endDate, client_id } = req.query;

        try {
            let filterClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 1;

            if (!isSuperAdmin && tenant_id) {
                filterClause += ` AND tenant_id = $${paramCount++}`;
                params.push(tenant_id);
            }

            // Definir datas padrão se não vierem (mês atual)
            const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

            filterClause += ` AND date >= $${paramCount++}`;
            params.push(start);
            filterClause += ` AND date <= $${paramCount++}`;
            params.push(end);

            if (client_id) {
                filterClause += ` AND client_id = $${paramCount++}`;
                params.push(client_id);
            }

            const totalsQuery = `
                SELECT 
                    SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as total_income,
                    SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as total_expense,
                    SUM(CASE WHEN type = 'income' AND status = 'pending' THEN amount ELSE 0 END) as pending_income,
                    SUM(CASE WHEN type = 'expense' AND status = 'pending' THEN amount ELSE 0 END) as pending_expense
                FROM financial_transactions
                ${filterClause}
            `;

            const cashFlowQuery = `
                SELECT 
                    TO_CHAR(date, 'YYYY-MM-DD') as day,
                    SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as income,
                    SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as expense
                FROM financial_transactions
                ${filterClause}
                GROUP BY day
                ORDER BY day
            `;

            // Para despesas por categoria, precisamos ajustar o filtro pois tem JOIN
            // Usando alias 't' para transactions
            let categoryFilterClause = 'WHERE t.type = \'expense\' AND t.status = \'paid\'';
            const catParams = [];
            let catParamCount = 1;

            if (!isSuperAdmin && tenant_id) {
                categoryFilterClause += ` AND t.tenant_id = $${catParamCount++}`;
                catParams.push(tenant_id);
            }

            categoryFilterClause += ` AND t.date >= $${catParamCount++}`;
            catParams.push(start);
            categoryFilterClause += ` AND t.date <= $${catParamCount++}`;
            catParams.push(end);

            if (client_id) {
                categoryFilterClause += ` AND t.client_id = $${catParamCount++}`;
                catParams.push(client_id);
            }

            console.log('DEBUG Dashboard:', {
                filterClause,
                categoryFilterClause,
                params,
                catParams
            });

            const categoryExpensesQuery = `
                SELECT c.name, c.color, SUM(t.amount) as value
                FROM financial_transactions t
                JOIN financial_categories c ON t.category_id = c.id
                ${categoryFilterClause}
                GROUP BY c.name, c.color
                ORDER BY value DESC
            `;

            // Query para Despesas por Cliente
            // Reutilizando a lógica de filtro de categoria pois é similar (expense, paid, date range)
            const clientExpensesQuery = `
                SELECT cl.name, SUM(t.amount) as value
                FROM financial_transactions t
                JOIN clients cl ON t.client_id = cl.id
                ${categoryFilterClause}
                GROUP BY cl.name
                ORDER BY value DESC
            `;

            const [totals, cashFlow, categoryExpenses, clientExpenses] = await Promise.all([
                db.query(totalsQuery, params),
                db.query(cashFlowQuery, params),
                db.query(categoryExpensesQuery, catParams),
                db.query(clientExpensesQuery, catParams)
            ]);

            res.json({
                success: true,
                summary: totals.rows[0] || { total_income: 0, total_expense: 0, pending_income: 0, pending_expense: 0 },
                cashFlow: cashFlow.rows,
                categoryExpenses: categoryExpenses.rows,
                clientExpenses: clientExpenses.rows
            });

        } catch (error) {
            console.error('Error fetching financial dashboard:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    // --- AUXILIARY (Categories, Suppliers, Clients) ---

    getClients: async (req, res) => {
        const { tenant_id, role } = req.user;
        const isSuperAdmin = role === 'super_admin' || role === 'Super Admin' || role === 'super_user';

        try {
            let query = `SELECT id, name FROM clients`;
            let params = [];

            if (!isSuperAdmin && tenant_id) {
                query += ` WHERE tenant_id = $1`;
                params.push(tenant_id);
            }

            query += ` ORDER BY name`;
            const result = await db.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    getCategories: async (req, res) => {
        const { tenant_id, role } = req.user;
        const isSuperAdmin = role === 'super_admin' || role === 'Super Admin' || role === 'super_user';

        try {
            let query = `SELECT * FROM financial_categories`;
            let params = [];

            if (!isSuperAdmin) {
                query += ` WHERE tenant_id = $1 OR is_default = true`;
                params.push(tenant_id);
            } else {
                // Super admin sees all, or maybe just all defaults + all tenants? 
                // Usually super admin wants to see everything.
                // But if we want to be safe, maybe just 1=1
                query += ` WHERE 1=1`;
            }

            query += ` ORDER BY type, name`;

            const result = await db.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    createCategory: async (req, res) => {
        const { tenant_id } = req.user;
        const { name, type, color } = req.body;
        try {
            const result = await db.query(`
                INSERT INTO financial_categories (tenant_id, name, type, color)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [tenant_id, name, type, color]);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    updateCategory: async (req, res) => {
        const { id } = req.params;
        const { name, type, color } = req.body;
        try {
            const result = await db.query(`
                UPDATE financial_categories 
                SET name = $1, type = $2, color = $3
                WHERE id = $4
                RETURNING *
            `, [name, type, color, id]);

            if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Category not found' });
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    getSuppliers: async (req, res) => {
        const { tenant_id, role } = req.user;
        const isSuperAdmin = role === 'super_admin' || role === 'Super Admin' || role === 'super_user';

        try {
            let query = `SELECT * FROM suppliers`;
            let params = [];

            if (!isSuperAdmin) {
                query += ` WHERE tenant_id = $1`;
                params.push(tenant_id);
            }

            query += ` ORDER BY name`;
            const result = await db.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    createSupplier: async (req, res) => {
        const { tenant_id } = req.user;
        const { name, contact_name, email, phone, service_type, tax_id, pix_key, notes } = req.body;
        try {
            const result = await db.query(`
                INSERT INTO suppliers (tenant_id, name, contact_name, email, phone, service_type, tax_id, pix_key, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [tenant_id, name, contact_name, email, phone, service_type, tax_id, pix_key, notes]);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Error creating supplier:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    // --- JOBS ---

    runSync: async (req, res) => {
        try {
            const result = await syncCampaignCosts();
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: 'Sync failed' });
        }
    }
};

module.exports = financialController;
