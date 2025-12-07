/**
 * SEED: Bens de Consumo (CPG - Consumer Packaged Goods)
 * Dados sintéticos para indústria de bens de consumo
 * Vertical: FMCG / Indústria
 */

const db = require('../database');

const seedBensConsumo = async () => {
    console.log('📦 Iniciando seed Bens de Consumo...');

    try {
        // ===== TENANT =====
        const tenantResult = await db.opsQuery(`
      INSERT INTO tenants (name, cnpj, email, phone, address_city, address_state, plan_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, ['NaturaBem Indústria', '56.789.012/0001-34', 'comercial@naturabem.com.br', '(11) 4567-8901',
            'São Paulo', 'SP', 3, 'active']);

        const tenantId = tenantResult.rows[0]?.id || 4;
        console.log(`  ✅ Tenant criado: ID ${tenantId}`);

        // ===== CLIENTS (Distribuidores/Varejistas) =====
        const clientesCPG = [
            { name: 'Distribuidora Nacional LTDA', type: 'PJ', email: 'comercial@distnacional.com.br', phone: '11987654321', city: 'São Paulo', cnpj: '11.222.333/0001-44', source: 'Prospecção', notes: 'Distribuidor exclusivo região SP' },
            { name: 'Atacado Regional Norte', type: 'PJ', email: 'compras@atacadonorte.com.br', phone: '92976543210', city: 'Manaus', cnpj: '22.333.444/0001-55', source: 'Feira', notes: 'Cobertura AM, PA, RO' },
            { name: 'Grupo Farmacêutico GF', type: 'PJ', email: 'trade@grupofarmaceutico.com.br', phone: '21965432109', city: 'Rio de Janeiro', cnpj: '33.444.555/0001-66', source: 'Indicação', notes: 'Rede 450 farmácias' },
            { name: 'Hipermercado Carrefour', type: 'PJ', email: 'category@carrefour.com.br', phone: '11954321098', city: 'São Paulo', cnpj: '44.555.666/0001-77', source: 'Key Account', notes: 'Nacional - categoria higiene' },
            { name: 'Pague Menos Drogarias', type: 'PJ', email: 'comercial@paguemenos.com.br', phone: '85943210987', city: 'Fortaleza', cnpj: '55.666.777/0001-88', source: 'Key Account', notes: 'Rede 1200 lojas' },
            { name: 'Distribuidora Sul', type: 'PJ', email: 'vendas@distsul.com.br', phone: '51932109876', city: 'Porto Alegre', cnpj: '66.777.888/0001-99', source: 'Prospecção', notes: 'RS, SC, PR' },
            { name: 'Walmart Brasil', type: 'PJ', email: 'supply@walmart.com.br', phone: '11921098765', city: 'São Paulo', cnpj: '77.888.999/0001-00', source: 'Key Account', notes: 'Hipermercados nacional' },
            { name: 'Casas Bahia / Via', type: 'PJ', email: 'trade@viabahia.com.br', phone: '11910987654', city: 'São Paulo', cnpj: '88.999.000/0001-11', source: 'Key Account', notes: 'Eletroportáteis' },
            { name: 'Magazine Luiza', type: 'PJ', email: 'compras@magazineluiza.com.br', phone: '16909876543', city: 'Franca', cnpj: '99.000.111/0001-22', source: 'Key Account', notes: 'Nacional + marketplace' },
            { name: 'Dist. Nordeste Express', type: 'PJ', email: 'northeast@distexpress.com.br', phone: '81898765432', city: 'Recife', cnpj: '00.111.222/0001-33', source: 'Feira', notes: 'Cobertura todo NE' },
            { name: 'Atacadão Distribuição', type: 'PJ', email: 'atacadao@dist.com.br', phone: '11887654321', city: 'São Paulo', cnpj: '11.223.344/0001-55', source: 'Key Account', notes: 'Cash & Carry nacional' },
            { name: 'Lojas Americanas', type: 'PJ', email: 'supply@americanas.com', phone: '21876543210', city: 'Rio de Janeiro', cnpj: '22.334.455/0001-66', source: 'Key Account', notes: 'Varejo + Digital' },
        ];

        const clientIds = [];
        for (const c of clientesCPG) {
            const res = await db.crossoverQuery(`
        INSERT INTO clients (tenant_id, name, type, email, phone, address_city, document, referral_source, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [tenantId, c.name, c.type, c.email, c.phone, c.city, c.cnpj, c.source, c.notes]);
            if (res.rows[0]) clientIds.push(res.rows[0].id);
        }
        console.log(`  ✅ ${clientIds.length} clientes criados`);

        // ===== LEADS =====
        const leadsData = [
            { name: 'Rede Drogasil', email: 'trade@drogasil.com.br', phone: '11999112233', source: 'Feira ABRAS', product: 'Linha Higiene Premium', value: 450000.00, status: 'new' },
            { name: 'Grupo Big', email: 'compras@grupobig.com.br', phone: '51988223344', source: 'Key Account', product: 'Limpeza - Mix Completo', value: 890000.00, status: 'contacted' },
            { name: 'Rede Dia', email: 'trade@dia.com.br', phone: '11977334455', source: 'Prospecção', product: 'Marca Própria', value: 1200000.00, status: 'qualified' },
            { name: 'GPA/Pão de Açúcar', email: 'category@gpabr.com', phone: '11966445566', source: 'Key Account', product: 'Bebidas Funcionais', value: 2500000.00, status: 'negotiating' },
            { name: 'RaiaDrogasil', email: 'supply@rd.com.br', phone: '11955556677', source: 'Feira', product: 'Dermocosméticos', value: 780000.00, status: 'won' },
            { name: 'Assaí Atacadista', email: 'comercial@assai.com.br', phone: '11944667788', source: 'Key Account', product: 'Higiene Atacado', value: 3400000.00, status: 'won' },
            { name: 'Grupo Mateus', email: 'compras@grupomateus.com.br', phone: '98933778899', source: 'Prospecção', product: 'Mix Regional NE', value: 560000.00, status: 'new' },
            { name: 'Rede Oba Hortifruti', email: 'trade@obahortifruti.com.br', phone: '11922889900', source: 'Indicação', product: 'Naturais Premium', value: 180000.00, status: 'contacted' },
            { name: 'Havan Lojas', email: 'compras@havan.com.br', phone: '47911990011', source: 'Feira', product: 'Linha Casa', value: 920000.00, status: 'qualified' },
            { name: 'Coop Supermercados', email: 'comercial@coop.com.br', phone: '11900110022', source: 'Prospecção', product: 'Exclusivos Coop', value: 340000.00, status: 'negotiating' },
            { name: 'Makro Atacadista', email: 'category@makro.com.br', phone: '11899220033', source: 'Key Account', product: 'Food Service', value: 1800000.00, status: 'new' },
            { name: 'Hirota Supermercados', email: 'trade@hirota.com.br', phone: '11888330044', source: 'Indicação', product: 'Importados/Oriental', value: 290000.00, status: 'contacted' },
        ];

        for (const l of leadsData) {
            await db.opsQuery(`
        INSERT INTO leads (tenant_id, name, email, phone, source, product_interest, value, status, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [tenantId, l.name, l.email, l.phone, l.source, l.product, l.value, l.status,
                ['cpg', 'industria', l.value > 1000000 ? 'enterprise' : 'mid-market']]);
        }
        console.log(`  ✅ ${leadsData.length} leads criados`);

        // ===== FINANCIAL TRANSACTIONS =====
        const transactions = [
            // Faturamento B2B (income)
            { desc: 'NF 45001 - Dist. Nacional - Higiene', amount: 458900.00, type: 'income', date: '2024-11-01', status: 'paid' },
            { desc: 'NF 45002 - Atacado Norte - Mix', amount: 234500.00, type: 'income', date: '2024-11-03', status: 'paid' },
            { desc: 'NF 45003 - Grupo GF - Dermo', amount: 567800.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'NF 45004 - Carrefour - Mensal', amount: 1890000.00, type: 'income', date: '2024-11-07', status: 'paid' },
            { desc: 'NF 45005 - Pague Menos - Q4', amount: 980000.00, type: 'income', date: '2024-11-10', status: 'paid' },
            { desc: 'NF 45006 - Dist. Sul - Limpeza', amount: 345600.00, type: 'income', date: '2024-11-12', status: 'paid' },
            { desc: 'NF 45007 - Walmart - Semanal', amount: 789000.00, type: 'income', date: '2024-11-13', status: 'paid' },
            { desc: 'NF 45008 - Magazine Luiza', amount: 456700.00, type: 'income', date: '2024-11-15', status: 'paid' },
            { desc: 'NF 45009 - Atacadão - Mensal', amount: 2340000.00, type: 'income', date: '2024-11-18', status: 'paid' },
            { desc: 'NF 45010 - Americanas - Nov', amount: 567800.00, type: 'income', date: '2024-11-20', status: 'paid' },
            { desc: 'NF 45011 - Via Varejo', amount: 234500.00, type: 'income', date: '2024-11-22', status: 'paid' },
            { desc: 'NF 45012 - Assaí - Mensal', amount: 3456000.00, type: 'income', date: '2024-11-25', status: 'paid' },
            { desc: 'NF 45013 - NE Express', amount: 189000.00, type: 'income', date: '2024-11-27', status: 'pending' },
            { desc: 'NF 45014 - Sell Out Bonificação', amount: 450000.00, type: 'income', date: '2024-11-28', status: 'paid' },
            { desc: 'Rebate Q4 - Carrefour', amount: 125000.00, type: 'income', date: '2024-11-29', status: 'pending' },
            // Custos industriais (expense)
            { desc: 'MP - Matéria Prima Nov', amount: 4500000.00, type: 'expense', date: '2024-11-01', status: 'paid' },
            { desc: 'Embalagens - Fornecedor A', amount: 890000.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Logística Outbound - Nov', amount: 650000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Trade Marketing - Materiais', amount: 350000.00, type: 'expense', date: '2024-11-15', status: 'paid' },
            { desc: 'Mídia Digital - Nov', amount: 280000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Folha Industrial - Nov', amount: 1200000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Energia Fábrica', amount: 450000.00, type: 'expense', date: '2024-11-28', status: 'paid' },
            { desc: 'P&D - Novos Produtos', amount: 180000.00, type: 'expense', date: '2024-11-20', status: 'paid' },
            { desc: 'Certificações e Compliance', amount: 45000.00, type: 'expense', date: '2024-11-10', status: 'paid' },
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
            { device: 'Desktop', percentage: 72.5, conversions: 456 },
            { device: 'Mobile', percentage: 22.3, conversions: 142 },
            { device: 'Tablet', percentage: 5.2, conversions: 33 },
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
            { content: '🏭 NaturaBem na APAS Show 2024! Visite nosso estande e conheça os lançamentos. #industria #cpg', platform: 'linkedin', status: 'published', date: '2024-11-20 09:00:00' },
            { content: 'Novo produto: Sabonete Antibacteriano Natural! Sem parabenos, vegano, sustentável. 🌱', platform: 'instagram', status: 'published', date: '2024-11-22 10:00:00' },
            { content: 'Case de sucesso: Como aumentamos 23% o sell-out no varejo com trade marketing inteligente.', platform: 'linkedin', status: 'published', date: '2024-11-24 14:00:00' },
            { content: '📊 Relatório do Setor: Tendências de consumo sustentável para 2025. Download gratuito!', platform: 'linkedin', status: 'published', date: '2024-11-26 11:00:00' },
            { content: 'Bastidores: Conheça nossa fábrica e o processo de produção 100% sustentável. 🎬', platform: 'youtube', status: 'published', date: '2024-11-27 15:00:00' },
            { content: '🎄 Linha de Natal chegando nos PDVs! Embalagens especiais para presentear.', platform: 'instagram', status: 'scheduled', date: '2024-12-01 10:00:00' },
            { content: 'WEBINAR: Estratégias de Category Management para 2025. Inscreva-se!', platform: 'linkedin', status: 'scheduled', date: '2024-12-05 09:00:00' },
        ];

        for (const p of socialPosts) {
            await db.opsQuery(`
        INSERT INTO social_posts (client_id, content, platform, status, scheduled_date)
        VALUES ($1, $2, $3, $4, $5)
      `, [clientIds[0] || 1, p.content, p.platform, p.status, p.date]);
        }
        console.log(`  ✅ ${socialPosts.length} posts sociais criados`);

        console.log('✅ Seed Bens de Consumo concluído!\n');
        return { tenantId, clientIds };

    } catch (error) {
        console.error('❌ Erro no seed Bens de Consumo:', error);
        throw error;
    }
};

module.exports = seedBensConsumo;

if (require.main === module) {
    seedBensConsumo()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
