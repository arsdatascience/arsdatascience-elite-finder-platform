require('dotenv').config({ path: './backend/.env' });
const db = require('../db');

const seedFinancialData2026 = async () => {
    console.log('🌱 Starting Financial Data Seed (Dec 2025 - Dec 2026)...');

    try {
        // 1. Get Tenant
        let tenantRes = await db.query('SELECT id FROM tenants LIMIT 1');
        if (tenantRes.rows.length === 0) {
            // Create default tenant if not exists
            console.log('⚠️ No tenant found. Creating default tenant...');
            tenantRes = await db.query("INSERT INTO tenants (name) VALUES ('Default Tenant') RETURNING id");
        }
        const tenantId = tenantRes.rows[0].id;
        console.log(`Using Tenant ID: ${tenantId}`);

        // 2. Get All Clients
        const clientsRes = await db.query('SELECT id, name FROM clients WHERE tenant_id = $1', [tenantId]);
        const clients = clientsRes.rows;
        console.log(`Found ${clients.length} clients.`);

        if (clients.length === 0) {
            console.log('⚠️ No clients found. Creating dummy clients...');
            const dummyClients = ['Client A', 'Client B', 'Client C'];
            for (const name of dummyClients) {
                const newClient = await db.query('INSERT INTO clients (tenant_id, name) VALUES ($1, $2) RETURNING id, name', [tenantId, name]);
                clients.push(newClient.rows[0]);
            }
        }

        // 3. Get Categories
        const categoriesRes = await db.query('SELECT id, name, type FROM financial_categories WHERE tenant_id = $1', [tenantId]);
        let categories = categoriesRes.rows;

        // Ensure we have some categories if none exist
        if (categories.length === 0) {
            console.log('⚠️ No categories found. Creating defaults...');
            const defaultCats = [
                { name: 'Receita de Serviços', type: 'income', color: '#22c55e' },
                { name: 'Mídia Paga', type: 'expense', color: '#ef4444' },
                { name: 'Ferramentas', type: 'expense', color: '#3b82f6' }
            ];
            for (const cat of defaultCats) {
                const newCat = await db.query('INSERT INTO financial_categories (tenant_id, name, type, color) VALUES ($1, $2, $3, $4) RETURNING id, name, type', [tenantId, cat.name, cat.type, cat.color]);
                categories.push(newCat.rows[0]);
            }
        }

        const incomeCategories = categories.filter(c => c.type === 'income');
        const expenseCategories = categories.filter(c => c.type === 'expense');

        // 4. Generate Transactions
        const startDate = new Date('2024-12-01');
        const endDate = new Date('2025-12-01');

        let transactionCount = 0;

        // For each month in the range
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // Monthly Fixed Income per Client (Retainer)
            for (const client of clients) {
                if (incomeCategories.length > 0) {
                    const cat = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
                    const amount = 2000 + Math.random() * 5000; // 2k - 7k

                    // Random day in month
                    const day = Math.floor(Math.random() * 28) + 1;
                    const transDate = new Date(year, month, day);

                    await db.query(`
                        INSERT INTO financial_transactions (
                            tenant_id, description, amount, type, category_id, client_id, date, status, payment_method
                        ) VALUES ($1, $2, $3, 'income', $4, $5, $6, 'paid', 'boleto')
                    `, [tenantId, `Fee Mensal - ${client.name}`, amount.toFixed(2), cat.id, client.id, transDate]);
                    transactionCount++;
                }

                // Random Expenses per Client (Ads, etc)
                if (expenseCategories.length > 0) {
                    const numExpenses = Math.floor(Math.random() * 3) + 1; // 1 to 3 expenses
                    for (let i = 0; i < numExpenses; i++) {
                        const cat = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
                        const amount = 500 + Math.random() * 2000; // 500 - 2500

                        const day = Math.floor(Math.random() * 28) + 1;
                        const transDate = new Date(year, month, day);

                        await db.query(`
                            INSERT INTO financial_transactions (
                                tenant_id, description, amount, type, category_id, client_id, date, status, payment_method
                            ) VALUES ($1, $2, $3, 'expense', $4, $5, $6, 'paid', 'credit_card')
                        `, [tenantId, `Despesa ${cat.name} - ${client.name}`, amount.toFixed(2), cat.id, client.id, transDate]);
                        transactionCount++;
                    }
                }
            }

            // General Expenses (Not linked to client)
            if (expenseCategories.length > 0) {
                const numGeneral = Math.floor(Math.random() * 5) + 2;
                for (let i = 0; i < numGeneral; i++) {
                    const cat = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
                    const amount = 100 + Math.random() * 1000;

                    const day = Math.floor(Math.random() * 28) + 1;
                    const transDate = new Date(year, month, day);

                    await db.query(`
                        INSERT INTO financial_transactions (
                            tenant_id, description, amount, type, category_id, date, status, payment_method
                        ) VALUES ($1, $2, $3, 'expense', $4, $5, 'paid', 'pix')
                    `, [tenantId, `Despesa Operacional - ${cat.name}`, amount.toFixed(2), cat.id, transDate]);
                    transactionCount++;
                }
            }

            // Next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        console.log(`✅ Successfully inserted ${transactionCount} transactions from Dec 2025 to Dec 2026.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedFinancialData2026();
