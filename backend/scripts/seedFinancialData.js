require('dotenv').config({ path: './backend/.env' }); // Ajuste o caminho conforme necessário
const db = require('../db');

const seedFinancialData = async () => {
    console.log('🌱 Starting Financial Data Seed...');

    try {
        // 1. Garantir Tenant (usando o primeiro encontrado ou criando um dummy)
        let tenantRes = await db.query('SELECT id FROM tenants LIMIT 1');
        let tenantId;
        if (tenantRes.rows.length === 0) {
            const newTenant = await db.query("INSERT INTO tenants (name) VALUES ('Demo Agency') RETURNING id");
            tenantId = newTenant.rows[0].id;
        } else {
            tenantId = tenantRes.rows[0].id;
        }
        console.log(`Using Tenant ID: ${tenantId}`);

        // 2. Criar/Garantir 3 Clientes
        const clientsData = [
            { name: 'Tech Solutions Ltda', industry: 'Technology' },
            { name: 'Dr. Silva Clínica', industry: 'Healthcare' },
            { name: 'Ecommerce Brasil', industry: 'Retail' }
        ];

        const clientIds = [];
        for (const c of clientsData) {
            let clientRes = await db.query('SELECT id FROM clients WHERE name = $1 AND tenant_id = $2', [c.name, tenantId]);
            if (clientRes.rows.length === 0) {
                const newClient = await db.query(
                    'INSERT INTO clients (tenant_id, name, industry) VALUES ($1, $2, $3) RETURNING id',
                    [tenantId, c.name, c.industry]
                );
                clientIds.push(newClient.rows[0].id);
            } else {
                clientIds.push(clientRes.rows[0].id);
            }
        }
        console.log(`Clients ready: ${clientIds.length}`);

        // 3. Criar Categorias
        const categoriesData = [
            // Receitas
            { name: 'Receita de Serviços (Fee)', type: 'income', color: '#22c55e' },
            { name: 'Setup & Onboarding', type: 'income', color: '#86efac' },
            { name: 'Desenvolvimento Web', type: 'income', color: '#16a34a' },
            { name: 'Consultoria', type: 'income', color: '#15803d' },
            // Despesas
            { name: 'Ferramentas & Software', type: 'expense', color: '#3b82f6' },
            { name: 'Impostos', type: 'expense', color: '#64748b' },
            { name: 'Mídia Paga (Ads)', type: 'expense', color: '#ef4444' },
            { name: 'Pessoal & Salários', type: 'expense', color: '#eab308' },
            { name: 'Aluguel & Escritório', type: 'expense', color: '#f97316' }
        ];

        const categoryMap = {}; // name -> id

        for (const cat of categoriesData) {
            let catRes = await db.query('SELECT id FROM financial_categories WHERE name = $1 AND tenant_id = $2', [cat.name, tenantId]);
            if (catRes.rows.length === 0) {
                const newCat = await db.query(
                    'INSERT INTO financial_categories (tenant_id, name, type, color, is_default) VALUES ($1, $2, $3, $4, true) RETURNING id',
                    [tenantId, cat.name, cat.type, cat.color]
                );
                categoryMap[cat.name] = newCat.rows[0].id;
            } else {
                categoryMap[cat.name] = catRes.rows[0].id;
            }
        }
        console.log('Categories ready');

        // 4. Gerar Transações (Últimos 3 meses)
        const transactions = [];
        const today = new Date();

        // Helper para data aleatória nos últimos 90 dias
        const randomDate = (start, end) => {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        };

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);

        // Gerar Receitas (Fees mensais e projetos pontuais)
        for (const clientId of clientIds) {
            // Fee Mensal (3 meses)
            for (let i = 0; i < 3; i++) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                date.setDate(5); // Dia 5 de cada mês

                await db.query(`
                    INSERT INTO financial_transactions (
                        tenant_id, description, amount, type, category_id, client_id, date, status, payment_method
                    ) VALUES ($1, $2, $3, 'income', $4, $5, $6, 'paid', 'boleto')
                `, [
                    tenantId,
                    'Fee Mensal de Marketing',
                    3500.00 + (Math.random() * 1000), // Valor variável entre 3500 e 4500
                    categoryMap['Receita de Serviços (Fee)'],
                    clientId,
                    date
                ]);
            }

            // Projetos Pontuais (Web ou Setup) - Aleatório
            if (Math.random() > 0.5) {
                await db.query(`
                    INSERT INTO financial_transactions (
                        tenant_id, description, amount, type, category_id, client_id, date, status, payment_method
                    ) VALUES ($1, $2, $3, 'income', $4, $5, $6, 'paid', 'pix')
                `, [
                    tenantId,
                    'Desenvolvimento Landing Page',
                    2000.00,
                    categoryMap['Desenvolvimento Web'],
                    clientId,
                    randomDate(startDate, today)
                ]);
            }
        }

        // Gerar Despesas (Vinculadas a clientes ou gerais)
        // Mídia Paga (Ads) - Vinculada a clientes
        for (const clientId of clientIds) {
            for (let i = 0; i < 5; i++) { // 5 transações de ads por cliente
                await db.query(`
                    INSERT INTO financial_transactions (
                        tenant_id, description, amount, type, category_id, client_id, date, status, payment_method
                    ) VALUES ($1, $2, $3, 'expense', $4, $5, $6, 'paid', 'credit_card')
                `, [
                    tenantId,
                    'Recarga Google Ads',
                    500.00 + (Math.random() * 1500),
                    categoryMap['Mídia Paga (Ads)'],
                    clientId,
                    randomDate(startDate, today)
                ]);
            }
        }

        // Despesas Gerais (Sem cliente específico)
        const generalExpenses = [
            { desc: 'Assinatura CRM', amount: 299.90, cat: 'Ferramentas & Software' },
            { desc: 'Servidor VPS', amount: 150.00, cat: 'Ferramentas & Software' },
            { desc: 'Salário Assistente', amount: 2500.00, cat: 'Pessoal & Salários' },
            { desc: 'DAS Simples Nacional', amount: 800.00, cat: 'Impostos' }
        ];

        for (let i = 0; i < 3; i++) { // Para cada mês
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            date.setDate(20);

            for (const exp of generalExpenses) {
                await db.query(`
                    INSERT INTO financial_transactions (
                        tenant_id, description, amount, type, category_id, date, status, payment_method
                    ) VALUES ($1, $2, $3, 'expense', $4, $5, 'paid', 'bank_transfer')
                `, [
                    tenantId,
                    exp.desc,
                    exp.amount,
                    categoryMap[exp.cat],
                    date
                ]);
            }
        }

        console.log('✅ Financial Data Seed Completed Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedFinancialData();
