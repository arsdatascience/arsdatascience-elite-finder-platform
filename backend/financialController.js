const db = require('./db');

// --- TRANSACTIONS ---

const getTransactions = async (req, res) => {
    const { tenant_id } = req.user; // Assumindo que o middleware de auth adiciona isso
    const { startDate, endDate, type, status, category_id } = req.query;

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

        // Filtro por Tenant (se aplicável, ou se não for super admin global)
        if (tenant_id) {
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

        query += ` ORDER BY t.date DESC, t.created_at DESC`;

        const result = await db.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const createTransaction = async (req, res) => {
    const { tenant_id, id: user_id } = req.user;
    const {
        description, amount, type, category_id, supplier_id,
        campaign_id, client_id, related_user_id, // user_id vinculado à transação (ex: pagamento de comissão)
        date, due_date, payment_date, status, payment_method, notes
    } = req.body;

    try {
        const result = await db.query(`
            INSERT INTO financial_transactions (
                tenant_id, description, amount, type, category_id, supplier_id,
                campaign_id, client_id, user_id,
                date, due_date, payment_date, status, payment_method, notes, created_by
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
};

const updateTransaction = async (req, res) => {
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
                date=$9, due_date=$10, payment_date=$11, status=$12, payment_method=$13, notes=$14,
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
};

const deleteTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM financial_transactions WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

// --- DASHBOARD & ANALYTICS ---

const getFinancialDashboard = async (req, res) => {
    const { tenant_id } = req.user;
    const { startDate, endDate } = req.query; // Padrão: Mês atual se não informado

    try {
        // 1. Totais (Receita, Despesa, Pendente, Pago)
        // Usar COALESCE para garantir 0 se null
        const totalsQuery = `
            SELECT 
                SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as total_expense,
                SUM(CASE WHEN type = 'income' AND status = 'pending' THEN amount ELSE 0 END) as pending_income,
                SUM(CASE WHEN type = 'expense' AND status = 'pending' THEN amount ELSE 0 END) as pending_expense
            FROM financial_transactions
            WHERE tenant_id = $1 AND date >= $2 AND date <= $3
        `;

        // 2. Fluxo de Caixa (Agrupado por dia)
        const cashFlowQuery = `
            SELECT 
                TO_CHAR(date, 'YYYY-MM-DD') as day,
                SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as expense
            FROM financial_transactions
            WHERE tenant_id = $1 AND date >= $2 AND date <= $3
            GROUP BY day
            ORDER BY day
        `;

        // 3. Despesas por Categoria
        const categoryExpensesQuery = `
            SELECT c.name, c.color, SUM(t.amount) as value
            FROM financial_transactions t
            JOIN financial_categories c ON t.category_id = c.id
            WHERE t.tenant_id = $1 AND t.type = 'expense' AND t.status = 'paid' AND t.date >= $2 AND t.date <= $3
            GROUP BY c.name, c.color
            ORDER BY value DESC
        `;

        const [totals, cashFlow, categoryExpenses] = await Promise.all([
            db.query(totalsQuery, [tenant_id, startDate, endDate]),
            db.query(cashFlowQuery, [tenant_id, startDate, endDate]),
            db.query(categoryExpensesQuery, [tenant_id, startDate, endDate])
        ]);

        res.json({
            success: true,
            summary: totals.rows[0],
            cashFlow: cashFlow.rows,
            categoryExpenses: categoryExpenses.rows
        });

    } catch (error) {
        console.error('Error fetching financial dashboard:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

// --- AUXILIARY (Categories, Suppliers) ---

const getCategories = async (req, res) => {
    const { tenant_id } = req.user;
    try {
        // Buscar categorias do tenant OU categorias padrão (is_default = true)
        const result = await db.query(`
            SELECT * FROM financial_categories 
            WHERE tenant_id = $1 OR is_default = true 
            ORDER BY type, name
        `, [tenant_id]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createCategory = async (req, res) => {
    const { tenant_id } = req.user;
    const { name, type, color } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO financial_categories (tenant_id, name, type, color) VALUES ($1, $2, $3, $4) RETURNING *',
            [tenant_id, name, type, color]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getSuppliers = async (req, res) => {
    const { tenant_id } = req.user;
    try {
        const result = await db.query('SELECT * FROM suppliers WHERE tenant_id = $1 ORDER BY name', [tenant_id]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createSupplier = async (req, res) => {
    const { tenant_id } = req.user;
    const { name, contact_name, email, phone, service_type, tax_id, pix_key, notes } = req.body;
    try {
        const result = await db.query(`
            INSERT INTO suppliers (tenant_id, name, contact_name, email, phone, service_type, tax_id, pix_key, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `, [tenant_id, name, contact_name, email, phone, service_type, tax_id, pix_key, notes]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getFinancialDashboard,
    getCategories,
    createCategory,
    getSuppliers,
    createSupplier
};
