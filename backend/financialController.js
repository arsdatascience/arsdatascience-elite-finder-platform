const db = require('./database');
const corePool = db;
const opsPool = db.opsPool;
const { syncCampaignCosts } = require('./jobs/financialSync');
const { getTenantScope } = require('./utils/tenantSecurity');

const financialController = {
    // --- TRANSACTIONS ---

    getTransactions: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { startDate, endDate, type, status, category_id, client_id } = req.query;

        try {
            // 1. Fetch Transactions from Ops DB (Join Categories/Suppliers OK, Users/Clients NO)
            let query = `
                SELECT t.*, 
                       c.name as category_name, c.color as category_color,
                       s.name as supplier_name
                FROM financial_transactions t
                LEFT JOIN financial_categories c ON t.category_id = c.id
                LEFT JOIN suppliers s ON t.supplier_id = s.id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

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

            const result = await opsPool.query(query, params);
            const transactions = result.rows;

            if (transactions.length === 0) {
                return res.json({ success: true, data: [] });
            }

            // 2. Extract IDs for Core DB enrichment
            const userIds = [...new Set(transactions.map(t => t.user_id).filter(id => id))];
            const clientIds = [...new Set(transactions.map(t => t.client_id).filter(id => id))];

            // 3. Fetch Data from Core DB
            let users = [];
            let clients = [];

            if (userIds.length > 0) {
                const usersRes = await corePool.query(
                    `SELECT id, name FROM users WHERE id = ANY($1)`,
                    [userIds]
                );
                users = usersRes.rows;
            }

            if (clientIds.length > 0) {
                const clientsRes = await corePool.query(
                    `SELECT id, name FROM clients WHERE id = ANY($1)`,
                    [clientIds]
                );
                clients = clientsRes.rows;
            }

            // 4. Merge Data
            const enrichedTransactions = transactions.map(t => {
                const user = users.find(u => u.id === t.user_id);
                const client = clients.find(c => c.id === t.client_id);
                return {
                    ...t,
                    user_name: user ? user.name : null,
                    client_name: client ? client.name : null
                };
            });

            res.json({ success: true, data: enrichedTransactions });
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
            const result = await opsPool.query(`
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
            const result = await opsPool.query(`
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
            await opsPool.query('DELETE FROM financial_transactions WHERE id = $1', [id]);
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting transaction:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    // --- DASHBOARD & ANALYTICS ---

    getFinancialDashboard: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { startDate, endDate, client_id } = req.query;

        try {
            let filterClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 1;

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

            // Alias 't' for transactions used here
            let categoryFilterClause = 'WHERE t.type = \'expense\' AND t.status = \'paid\'';
            const catParams = [];
            let catParamCount = 1;

            categoryFilterClause += ` AND t.date >= $${catParamCount++}`;
            catParams.push(start);
            categoryFilterClause += ` AND t.date <= $${catParamCount++}`;
            catParams.push(end);

            if (client_id) {
                categoryFilterClause += ` AND t.client_id = $${catParamCount++}`;
                catParams.push(client_id);
            }

            const categoryExpensesQuery = `
                SELECT c.name, c.color, SUM(t.amount) as value
                FROM financial_transactions t
                JOIN financial_categories c ON t.category_id = c.id
                ${categoryFilterClause}
                GROUP BY c.name, c.color
                ORDER BY value DESC
            `;

            // Note: Join with Clients will fail if cross-DB. We must remove JOIN and enrich or simplify.
            // Simplified: Just returning client_id group for now, or removing this chart temporarily?
            // Or better: Group by client_id and fetch names after.

            const clientExpensesQuery = `
                SELECT t.client_id, SUM(t.amount) as value
                FROM financial_transactions t
                ${categoryFilterClause}
                GROUP BY t.client_id
                ORDER BY value DESC
            `;

            const [totals, cashFlow, categoryExpenses, clientExpensesRes] = await Promise.all([
                opsPool.query(totalsQuery, params),
                opsPool.query(cashFlowQuery, params),
                opsPool.query(categoryExpensesQuery, catParams),
                opsPool.query(clientExpensesQuery, catParams)
            ]);

            // Enrich Client Names
            let finalClientExpenses = clientExpensesRes.rows;
            if (finalClientExpenses.length > 0) {
                const cIds = [...new Set(finalClientExpenses.map(r => r.client_id).filter(id => id))];
                if (cIds.length > 0) {
                    const cRes = await corePool.query(`SELECT id, name FROM clients WHERE id = ANY($1)`, [cIds]);
                    const cMap = {};
                    cRes.rows.forEach(c => cMap[c.id] = c.name);

                    finalClientExpenses = finalClientExpenses.map(r => ({
                        name: cMap[r.client_id] || 'Unknown Client',
                        value: r.value
                    }));
                }
            }

            res.json({
                success: true,
                summary: totals.rows[0] || { total_income: 0, total_expense: 0, pending_income: 0, pending_expense: 0 },
                cashFlow: cashFlow.rows,
                categoryExpenses: categoryExpenses.rows,
                clientExpenses: finalClientExpenses
            });

        } catch (error) {
            console.error('Error fetching financial dashboard:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    // --- AUXILIARY (Categories, Suppliers, Clients) ---

    getClients: async (req, res) => {
        // Clients are in CORE DB
        try {
            const result = await corePool.query(`SELECT id, name FROM clients ORDER BY name`);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ success: false, error: 'Database error' });
        }
    },

    getCategories: async (req, res) => {
        // Categories are in OPS DB
        try {
            const result = await opsPool.query(`SELECT * FROM financial_categories WHERE 1=1 ORDER BY type, name`);
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
            const result = await opsPool.query(`
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
            const result = await opsPool.query(`
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
        // Suppliers are in OPS DB?
        // Assuming OPS DB based on createSupplier usage of `db` (opsPool) in original code.
        try {
            const result = await opsPool.query(`SELECT * FROM suppliers ORDER BY name`);
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
            const result = await opsPool.query(`
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
