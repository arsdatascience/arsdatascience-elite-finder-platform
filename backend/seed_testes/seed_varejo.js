/**
 * SEED: Varejo (Loja Física + Online)
 * Dados sintéticos para rede de lojas de varejo
 * Vertical: Varejo / Retail
 */

const db = require('../database');

const seedVarejo = async () => {
    console.log('🏪 Iniciando seed Varejo...');

    try {
        // ===== TENANT =====
        const tenantResult = await db.opsQuery(`
      INSERT INTO tenants (name, cnpj, email, phone, address_city, address_state, plan_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, ['MegaStore Varejo', '45.678.901/0001-23', 'comercial@megastore.com.br', '(11) 2345-6789',
            'São Paulo', 'SP', 3, 'active']);

        const tenantId = tenantResult.rows[0]?.id || 3;
        console.log(`  ✅ Tenant criado: ID ${tenantId}`);

        // ===== CLIENTS (Clientes B2B e B2C) =====
        const clientesVarejo = [
            { name: 'Supermercado Bom Preço', type: 'PJ', email: 'compras@bompreco.com.br', phone: '11987654321', city: 'São Paulo', cnpj: '12.345.678/0001-90', source: 'Indicação' },
            { name: 'Loja Central LTDA', type: 'PJ', email: 'contato@lojacentral.com.br', phone: '11976543210', city: 'Campinas', cnpj: '23.456.789/0001-01', source: 'Prospecção' },
            { name: 'Mercado Popular', type: 'PJ', email: 'mercadopopular@gmail.com', phone: '11965432109', city: 'Osasco', cnpj: '34.567.890/0001-12', source: 'Feira' },
            { name: 'Atacadão do Vale', type: 'PJ', email: 'atacadaodovale@hotmail.com', phone: '11954321098', city: 'São José dos Campos', cnpj: '45.678.901/0001-23', source: 'Google' },
            { name: 'Rede MinhaLoja', type: 'PJ', email: 'compras@minhaloja.com.br', phone: '11943210987', city: 'Ribeirão Preto', cnpj: '56.789.012/0001-34', source: 'Meta Ads' },
            { name: 'Maria da Silva', type: 'PF', email: 'maria.silva@gmail.com', phone: '11932109876', city: 'São Paulo', cnpj: null, source: 'Loja Física' },
            { name: 'José Santos', type: 'PF', email: 'jose.santos@yahoo.com', phone: '11921098765', city: 'Guarulhos', cnpj: null, source: 'WhatsApp' },
            { name: 'Ana Oliveira', type: 'PF', email: 'ana.oliveira@hotmail.com', phone: '11910987654', city: 'Santo André', cnpj: null, source: 'Site' },
            { name: 'Carlos Ferreira', type: 'PF', email: 'carlos.f@gmail.com', phone: '11909876543', city: 'São Bernardo', cnpj: null, source: 'Instagram' },
            { name: 'Distribuidora Regional', type: 'PJ', email: 'regional@dist.com.br', phone: '11898765432', city: 'Sorocaba', cnpj: '67.890.123/0001-45', source: 'Indicação' },
            { name: 'Empório Gourmet', type: 'PJ', email: 'contato@emporiog.com.br', phone: '11887654321', city: 'Santos', cnpj: '78.901.234/0001-56', source: 'Feira' },
            { name: 'Super Econômico', type: 'PJ', email: 'super.eco@gmail.com', phone: '11876543210', city: 'Jundiaí', cnpj: '89.012.345/0001-67', source: 'Prospecção' },
        ];

        const clientIds = [];
        for (const c of clientesVarejo) {
            const res = await db.crossoverQuery(`
        INSERT INTO clients (tenant_id, name, type, email, phone, address_city, document, referral_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [tenantId, c.name, c.type, c.email, c.phone, c.city, c.cnpj, c.source]);
            if (res.rows[0]) clientIds.push(res.rows[0].id);
        }
        console.log(`  ✅ ${clientIds.length} clientes criados`);

        // ===== LEADS =====
        const leadsData = [
            { name: 'Mercado Extra Plus', email: 'compras@extraplus.com.br', phone: '11999112233', source: 'Feira APAS', product: 'Linha Alimentos - Atacado', value: 45000.00, status: 'new' },
            { name: 'Rede Compre Bem', email: 'comercial@comprebem.com.br', phone: '11988223344', source: 'Prospecção', product: 'Bebidas - Mix Completo', value: 78000.00, status: 'contacted' },
            { name: 'Loja da Família', email: 'lojafamilia@gmail.com', phone: '11977334455', source: 'Indicação', product: 'Higiene e Limpeza', value: 12000.00, status: 'qualified' },
            { name: 'Atacado Forte', email: 'atacadoforte@hotmail.com', phone: '11966445566', source: 'Google Ads', product: 'Eletroportáteis', value: 95000.00, status: 'negotiating' },
            { name: 'Minimercado Sol', email: 'minimercadosol@yahoo.com', phone: '11955556677', source: 'Meta Ads', product: 'Mercearia Geral', value: 8500.00, status: 'won' },
            { name: 'Supermercados União', email: 'uniao@supermercados.com.br', phone: '11944667788', source: 'Cold Call', product: 'Enlatados Premium', value: 55000.00, status: 'lost' },
            { name: 'Loja Neighborhood', email: 'neighborhood@loja.com.br', phone: '11933778899', source: 'LinkedIn', product: 'Produtos Gourmet', value: 23000.00, status: 'new' },
            { name: 'Empório Natural', email: 'emporionatural@gmail.com', phone: '11922889900', source: 'Instagram', product: 'Orgânicos e Naturais', value: 35000.00, status: 'contacted' },
            { name: 'Casa do Pão', email: 'casadopao@terra.com.br', phone: '11911990011', source: 'Feira', product: 'Padaria Congelada', value: 18000.00, status: 'qualified' },
            { name: 'Mercado Central SP', email: 'centralsp@mercado.com.br', phone: '11900110022', source: 'Prospecção', product: 'Mix Importados', value: 125000.00, status: 'negotiating' },
            { name: 'Loja Express 24h', email: 'express24@loja.com.br', phone: '11899220033', source: 'WhatsApp', product: 'Conveniência', value: 15000.00, status: 'won' },
            { name: 'Hiper Desconto', email: 'hiper@desconto.com.br', phone: '11888330044', source: 'Feira APAS', product: 'Linha Economia', value: 88000.00, status: 'new' },
        ];

        for (const l of leadsData) {
            await db.opsQuery(`
        INSERT INTO leads (tenant_id, name, email, phone, source, product_interest, value, status, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [tenantId, l.name, l.email, l.phone, l.source, l.product, l.value, l.status,
                ['varejo', 'b2b', l.value > 50000 ? 'key-account' : 'standard']]);
        }
        console.log(`  ✅ ${leadsData.length} leads criados`);

        // ===== FINANCIAL TRANSACTIONS =====
        const transactions = [
            // Vendas B2B (income)
            { desc: 'Pedido #VRJ-1001 - Sup. Bom Preço', amount: 45890.00, type: 'income', date: '2024-11-01', status: 'paid' },
            { desc: 'Pedido #VRJ-1002 - Loja Central', amount: 23450.00, type: 'income', date: '2024-11-03', status: 'paid' },
            { desc: 'Pedido #VRJ-1003 - Mercado Popular', amount: 12780.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'Pedido #VRJ-1004 - Atacadão Vale', amount: 89500.00, type: 'income', date: '2024-11-07', status: 'paid' },
            { desc: 'Pedido #VRJ-1005 - Rede MinhaLoja', amount: 156000.00, type: 'income', date: '2024-11-10', status: 'paid' },
            { desc: 'Pedido #VRJ-1006 - Dist. Regional', amount: 78900.00, type: 'income', date: '2024-11-12', status: 'paid' },
            { desc: 'Vendas Loja Física - Semana 1', amount: 34500.00, type: 'income', date: '2024-11-08', status: 'paid' },
            { desc: 'Vendas Loja Física - Semana 2', amount: 42300.00, type: 'income', date: '2024-11-15', status: 'paid' },
            { desc: 'Pedido #VRJ-1007 - Empório Gourmet', amount: 67800.00, type: 'income', date: '2024-11-18', status: 'paid' },
            { desc: 'Vendas E-commerce - Nov 1ª quinz.', amount: 28900.00, type: 'income', date: '2024-11-16', status: 'paid' },
            { desc: 'Pedido #VRJ-1008 - Super Econômico', amount: 45600.00, type: 'income', date: '2024-11-20', status: 'paid' },
            { desc: 'Black Friday - Loja Física', amount: 125000.00, type: 'income', date: '2024-11-25', status: 'paid' },
            { desc: 'Black Friday - E-commerce', amount: 89000.00, type: 'income', date: '2024-11-25', status: 'paid' },
            { desc: 'Pedido #VRJ-1009 - Key Account', amount: 234000.00, type: 'income', date: '2024-11-27', status: 'pending' },
            { desc: 'Vendas Loja Física - Semana 4', amount: 56700.00, type: 'income', date: '2024-11-29', status: 'paid' },
            // Custos operacionais (expense)
            { desc: 'Compra Fornecedor - Alimentos', amount: 185000.00, type: 'expense', date: '2024-11-01', status: 'paid' },
            { desc: 'Compra Fornecedor - Bebidas', amount: 120000.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Logística e Frete - Nov', amount: 45000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Aluguel CD + Lojas', amount: 85000.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Marketing Digital - Nov', amount: 25000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Folha de Pagamento - Nov', amount: 180000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Energia + Utilities', amount: 35000.00, type: 'expense', date: '2024-11-28', status: 'paid' },
            { desc: 'Sistema ERP - Mensalidade', amount: 4500.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Manutenção Equipamentos', amount: 12000.00, type: 'expense', date: '2024-11-15', status: 'paid' },
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
            { device: 'Mobile', percentage: 52.3, conversions: 1847 },
            { device: 'Desktop', percentage: 38.5, conversions: 1362 },
            { device: 'Tablet', percentage: 9.2, conversions: 326 },
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
            { content: '🛒 OFERTAS DA SEMANA! Confira os preços especiais para o seu negócio. Atacado e varejo. #ofertas #varejo', platform: 'instagram', status: 'published', date: '2024-11-20 09:00:00' },
            { content: 'BLACK NOVEMBER! Descontos de até 40% em toda linha de mercearia. Válido para empresas cadastradas.', platform: 'linkedin', status: 'published', date: '2024-11-22 10:00:00' },
            { content: '🎉 Novos produtos chegando! Linha gourmet premium agora disponível. Peça seu catálogo.', platform: 'instagram', status: 'published', date: '2024-11-24 11:00:00' },
            { content: 'Feira APAS 2024 - Visite nosso estande! Promoções exclusivas para visitantes.', platform: 'linkedin', status: 'published', date: '2024-11-25 08:00:00' },
            { content: 'VÍDEO: Conheça nosso centro de distribuição automatizado! Tour virtual disponível.', platform: 'youtube', status: 'published', date: '2024-11-26 14:00:00' },
            { content: '🎄 Catálogo de Natal disponível! Produtos sazonais com entrega garantida.', platform: 'instagram', status: 'scheduled', date: '2024-12-01 10:00:00' },
            { content: 'WEBINAR: Tendências do varejo 2025. Inscreva-se gratuitamente!', platform: 'linkedin', status: 'scheduled', date: '2024-12-10 09:00:00' },
        ];

        for (const p of socialPosts) {
            await db.opsQuery(`
        INSERT INTO social_posts (client_id, content, platform, status, scheduled_date)
        VALUES ($1, $2, $3, $4, $5)
      `, [clientIds[0] || 1, p.content, p.platform, p.status, p.date]);
        }
        console.log(`  ✅ ${socialPosts.length} posts sociais criados`);

        console.log('✅ Seed Varejo concluído!\n');
        return { tenantId, clientIds };

    } catch (error) {
        console.error('❌ Erro no seed Varejo:', error);
        throw error;
    }
};

module.exports = seedVarejo;

if (require.main === module) {
    seedVarejo()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
