/**
 * SEED: E-Commerce
 * Dados sintéticos para loja virtual de moda/eletrônicos
 * Vertical: E-Commerce / Marketplace
 */

const db = require('../database');

const seedEcommerce = async () => {
    console.log('🛒 Iniciando seed E-Commerce...');

    try {
        // ===== TENANT =====
        const tenantResult = await db.opsQuery(`
      INSERT INTO tenants (name, cnpj, email, phone, address_city, address_state, plan_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, ['ModaShop E-commerce', '12.345.678/0001-90', 'contato@modashop.com.br', '(11) 99999-8888',
            'São Paulo', 'SP', 2, 'active']);

        const tenantId = tenantResult.rows[0]?.id || 1;
        console.log(`  ✅ Tenant criado: ID ${tenantId}`);

        // ===== CLIENTS (Clientes B2C) =====
        const clientesEcommerce = [
            { name: 'Maria Silva', type: 'PF', email: 'maria.silva@gmail.com', phone: '11987654321', whatsapp: '5511987654321', city: 'São Paulo', state: 'SP', gender: 'Feminino', source: 'Google Ads' },
            { name: 'João Santos', type: 'PF', email: 'joao.santos@hotmail.com', phone: '11976543210', whatsapp: '5511976543210', city: 'Campinas', state: 'SP', gender: 'Masculino', source: 'Instagram' },
            { name: 'Ana Oliveira', type: 'PF', email: 'ana.oliveira@yahoo.com', phone: '21998765432', whatsapp: '5521998765432', city: 'Rio de Janeiro', state: 'RJ', gender: 'Feminino', source: 'Facebook' },
            { name: 'Carlos Mendes', type: 'PF', email: 'carlos.mendes@outlook.com', phone: '31987654321', whatsapp: '5531987654321', city: 'Belo Horizonte', state: 'MG', gender: 'Masculino', source: 'Orgânico' },
            { name: 'Juliana Costa', type: 'PF', email: 'juliana.costa@gmail.com', phone: '41976543210', whatsapp: '5541976543210', city: 'Curitiba', state: 'PR', gender: 'Feminino', source: 'Indicação' },
            { name: 'Pedro Almeida', type: 'PF', email: 'pedro.almeida@gmail.com', phone: '51998876655', whatsapp: '5551998876655', city: 'Porto Alegre', state: 'RS', gender: 'Masculino', source: 'TikTok' },
            { name: 'Fernanda Lima', type: 'PF', email: 'fernanda.lima@icloud.com', phone: '71987654321', whatsapp: '5571987654321', city: 'Salvador', state: 'BA', gender: 'Feminino', source: 'Email Marketing' },
            { name: 'Bruno Ferreira', type: 'PF', email: 'bruno.ferreira@gmail.com', phone: '61998765432', whatsapp: '5561998765432', city: 'Brasília', state: 'DF', gender: 'Masculino', source: 'YouTube' },
            { name: 'Camila Rodrigues', type: 'PF', email: 'camila.rodrigues@terra.com.br', phone: '81976543210', whatsapp: '5581976543210', city: 'Recife', state: 'PE', gender: 'Feminino', source: 'Pinterest' },
            { name: 'Lucas Souza', type: 'PF', email: 'lucas.souza@gmail.com', phone: '91987654321', whatsapp: '5591987654321', city: 'Belém', state: 'PA', gender: 'Masculino', source: 'WhatsApp' },
            { name: 'Mariana Pereira', type: 'PF', email: 'mariana.pereira@gmail.com', phone: '85998765432', whatsapp: '5585998765432', city: 'Fortaleza', state: 'CE', gender: 'Feminino', source: 'Google Ads' },
            { name: 'Rafael Gomes', type: 'PF', email: 'rafael.gomes@hotmail.com', phone: '47976543210', whatsapp: '5547976543210', city: 'Joinville', state: 'SC', gender: 'Masculino', source: 'Meta Ads' },
        ];

        const clientIds = [];
        for (const c of clientesEcommerce) {
            const res = await db.crossoverQuery(`
        INSERT INTO clients (tenant_id, name, type, email, phone, whatsapp, address_city, address_state, gender, referral_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [tenantId, c.name, c.type, c.email, c.phone, c.whatsapp, c.city, c.state, c.gender, c.source]);
            if (res.rows[0]) clientIds.push(res.rows[0].id);
        }
        console.log(`  ✅ ${clientIds.length} clientes criados`);

        // ===== LEADS =====
        const leadsData = [
            { name: 'Patricia Nascimento', email: 'patricia.n@gmail.com', phone: '11999887766', source: 'Google Ads', product: 'Vestido Midi Floral', value: 189.90, status: 'new' },
            { name: 'Roberto Andrade', email: 'roberto.andrade@yahoo.com', phone: '21988776655', source: 'Instagram', product: 'Tênis Nike Air Max', value: 599.90, status: 'contacted' },
            { name: 'Beatriz Moura', email: 'bia.moura@hotmail.com', phone: '31977665544', source: 'Facebook', product: 'Bolsa Michael Kors', value: 1299.00, status: 'qualified' },
            { name: 'Thiago Martins', email: 'thiago.m@gmail.com', phone: '41966554433', source: 'TikTok', product: 'Relógio Smartwatch', value: 899.00, status: 'negotiating' },
            { name: 'Carla Ribeiro', email: 'carla.ribeiro@icloud.com', phone: '51955443322', source: 'Email', product: 'Kit Skincare Completo', value: 449.90, status: 'won' },
            { name: 'Marcos Vieira', email: 'marcos.v@terra.com.br', phone: '71944332211', source: 'WhatsApp', product: 'Notebook Dell', value: 4299.00, status: 'lost' },
            { name: 'Isabela Cunha', email: 'isabela.cunha@gmail.com', phone: '61933221100', source: 'Orgânico', product: 'Fone JBL Pro', value: 299.90, status: 'new' },
            { name: 'Daniel Barbosa', email: 'daniel.b@outlook.com', phone: '81922110099', source: 'YouTube', product: 'Câmera Canon EOS', value: 3599.00, status: 'contacted' },
            { name: 'Amanda Torres', email: 'amanda.torres@gmail.com', phone: '91911009988', source: 'Pinterest', product: 'Conjunto Fitness', value: 199.90, status: 'qualified' },
            { name: 'Henrique Dias', email: 'henrique.dias@hotmail.com', phone: '85900998877', source: 'Google Ads', product: 'Perfume Importado', value: 459.00, status: 'won' },
            { name: 'Larissa Pinto', email: 'larissa.p@icloud.com', phone: '47899887766', source: 'Meta Ads', product: 'Óculos Ray-Ban', value: 599.00, status: 'negotiating' },
            { name: 'Gustavo Ramos', email: 'gustavo.ramos@gmail.com', phone: '16988776655', source: 'Instagram', product: 'Mochila Executiva', value: 329.90, status: 'new' },
            { name: 'Natália Freitas', email: 'natalia.f@yahoo.com', phone: '27977665544', source: 'Facebook', product: 'Sandália Arezzo', value: 279.90, status: 'contacted' },
            { name: 'Felipe Cardoso', email: 'felipe.cardoso@gmail.com', phone: '62966554433', source: 'TikTok', product: 'iPhone 15 Pro', value: 8999.00, status: 'qualified' },
            { name: 'Vanessa Lopes', email: 'vanessa.lopes@hotmail.com', phone: '92955443322', source: 'Email', product: 'Blazer Alfaiataria', value: 399.90, status: 'won' },
        ];

        for (const l of leadsData) {
            await db.opsQuery(`
        INSERT INTO leads (tenant_id, name, email, phone, source, product_interest, value, status, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [tenantId, l.name, l.email, l.phone, l.source, l.product, l.value, l.status,
                ['e-commerce', 'moda', l.source.toLowerCase()]]);
        }
        console.log(`  ✅ ${leadsData.length} leads criados`);

        // ===== FINANCIAL TRANSACTIONS =====
        const transactions = [
            // Vendas (income)
            { desc: 'Venda #10234 - Vestido + Acessórios', amount: 459.80, type: 'income', date: '2024-11-01', status: 'paid' },
            { desc: 'Venda #10235 - Tênis Masculino', amount: 599.90, type: 'income', date: '2024-11-02', status: 'paid' },
            { desc: 'Venda #10236 - Kit Skincare Premium', amount: 849.70, type: 'income', date: '2024-11-03', status: 'paid' },
            { desc: 'Venda #10237 - Notebook Dell i7', amount: 4299.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'Venda #10238 - Combo Moda Praia', amount: 389.70, type: 'income', date: '2024-11-06', status: 'paid' },
            { desc: 'Venda #10239 - Relógio Smartwatch', amount: 899.00, type: 'income', date: '2024-11-08', status: 'paid' },
            { desc: 'Venda #10240 - iPhone 15 Pro 256GB', amount: 8999.00, type: 'income', date: '2024-11-10', status: 'paid' },
            { desc: 'Venda #10241 - Bolsa Premium Couro', amount: 1599.00, type: 'income', date: '2024-11-12', status: 'paid' },
            { desc: 'Venda #10242 - Perfume Importado Kit', amount: 789.00, type: 'income', date: '2024-11-15', status: 'paid' },
            { desc: 'Venda #10243 - Óculos + Case', amount: 649.90, type: 'income', date: '2024-11-18', status: 'pending' },
            { desc: 'Venda #10244 - Conjunto Fitness 3pçs', amount: 299.70, type: 'income', date: '2024-11-20', status: 'paid' },
            { desc: 'Venda #10245 - Fone JBL + Capa', amount: 359.80, type: 'income', date: '2024-11-22', status: 'paid' },
            { desc: 'Venda #10246 - Black Friday Bundle', amount: 2499.00, type: 'income', date: '2024-11-25', status: 'paid' },
            { desc: 'Venda #10247 - Câmera Canon + Lente', amount: 4599.00, type: 'income', date: '2024-11-27', status: 'paid' },
            { desc: 'Venda #10248 - Cyber Monday Promo', amount: 1899.00, type: 'income', date: '2024-11-28', status: 'pending' },
            // Custos (expense)
            { desc: 'Google Ads - Novembro', amount: 8500.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Meta Ads - Novembro', amount: 6200.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Fornecedor - Têxteis SP', amount: 15000.00, type: 'expense', date: '2024-11-15', status: 'paid' },
            { desc: 'Frete Correios - Nov', amount: 3400.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Plataforma E-commerce', amount: 599.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Influencer Marketing', amount: 4500.00, type: 'expense', date: '2024-11-20', status: 'paid' },
            { desc: 'Embalagens Premium', amount: 2100.00, type: 'expense', date: '2024-11-10', status: 'paid' },
            { desc: 'Folha de Pagamento', amount: 18000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
        ];

        for (const t of transactions) {
            await db.opsQuery(`
        INSERT INTO financial_transactions (tenant_id, description, amount, type, date, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [tenantId, t.desc, t.amount, t.type, t.date, t.status]);
        }
        console.log(`  ✅ ${transactions.length} transações financeiras criadas`);

        // ===== DEVICE STATS =====
        const deviceStats = [
            { device: 'Mobile', percentage: 68.5, conversions: 847 },
            { device: 'Desktop', percentage: 24.3, conversions: 302 },
            { device: 'Tablet', percentage: 7.2, conversions: 89 },
        ];

        for (const d of deviceStats) {
            await db.opsQuery(`
        INSERT INTO device_stats (client_id, device_type, percentage, conversions)
        VALUES ($1, $2, $3, $4)
      `, [clientIds[0] || 1, d.device, d.percentage, d.conversions]);
        }
        console.log(`  ✅ Device stats criados`);

        // ===== SOCIAL POSTS =====
        const socialPosts = [
            { content: '🔥 BLACK FRIDAY ANTECIPADA! Até 70% OFF em toda a loja. Corre que é por tempo limitado! #blackfriday #modafeminina', platform: 'instagram', status: 'published', date: '2024-11-20 10:00:00' },
            { content: 'Novidades chegando! Coleção Verão 2025 disponível. Confira os looks que vão bombar na próxima estação ☀️', platform: 'instagram', status: 'published', date: '2024-11-22 14:00:00' },
            { content: 'FRETE GRÁTIS para todo Brasil nas compras acima de R$299. Aproveite!', platform: 'facebook', status: 'published', date: '2024-11-23 11:00:00' },
            { content: 'Qual seu favorito? 1, 2 ou 3? Comenta aqui 👇 #moda #estilo #tendencias', platform: 'instagram', status: 'published', date: '2024-11-24 16:00:00' },
            { content: 'Tutorial: 5 formas de usar a mesma peça! Assista agora no link da bio 🎬', platform: 'tiktok', status: 'published', date: '2024-11-25 18:00:00' },
            { content: '🎅 Natal chegando! Confira nossas opções de presente até R$100', platform: 'facebook', status: 'scheduled', date: '2024-12-10 10:00:00' },
            { content: 'REELS: Unboxing do kit skincare mais vendido da loja! 📦✨', platform: 'instagram', status: 'scheduled', date: '2024-12-12 15:00:00' },
        ];

        for (const p of socialPosts) {
            await db.opsQuery(`
        INSERT INTO social_posts (client_id, content, platform, status, scheduled_date)
        VALUES ($1, $2, $3, $4, $5)
      `, [clientIds[0] || 1, p.content, p.platform, p.status, p.date]);
        }
        console.log(`  ✅ ${socialPosts.length} posts sociais criados`);

        console.log('✅ Seed E-Commerce concluído!\n');
        return { tenantId, clientIds };

    } catch (error) {
        console.error('❌ Erro no seed E-Commerce:', error);
        throw error;
    }
};

module.exports = seedEcommerce;

// Executar diretamente
if (require.main === module) {
    seedEcommerce()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
