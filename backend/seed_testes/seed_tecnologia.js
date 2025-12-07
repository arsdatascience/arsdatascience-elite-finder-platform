/**
 * SEED: Tecnologia e Serviços
 * Dados sintéticos para empresa de tecnologia/SaaS/consultoria
 * Vertical: Tech / SaaS / Serviços B2B
 */

const db = require('../database');

const seedTecnologia = async () => {
    console.log('💻 Iniciando seed Tecnologia/Serviços...');

    try {
        // ===== TENANT =====
        const tenantResult = await db.opsQuery(`
      INSERT INTO tenants (name, cnpj, email, phone, address_city, address_state, plan_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, ['TechNova Solutions', '67.890.123/0001-45', 'comercial@technova.com.br', '(11) 5678-9012',
            'São Paulo', 'SP', 3, 'active']);

        const tenantId = tenantResult.rows[0]?.id || 5;
        console.log(`  ✅ Tenant criado: ID ${tenantId}`);

        // ===== CLIENTS (Empresas B2B) =====
        const clientesTech = [
            { name: 'Banco Digital X', type: 'PJ', email: 'ti@bancodigitalx.com.br', phone: '11987654321', city: 'São Paulo', cnpj: '12.345.678/0001-01', source: 'Indicação', notes: 'Contrato Enterprise - 500 usuários' },
            { name: 'Seguros Brasil SA', type: 'PJ', email: 'tecnologia@segurosbrasil.com.br', phone: '11976543210', city: 'São Paulo', cnpj: '23.456.789/0001-12', source: 'Outbound', notes: 'Projeto automação sinistros' },
            { name: 'Logística Express', type: 'PJ', email: 'sistemas@logexpress.com.br', phone: '11965432109', city: 'Campinas', cnpj: '34.567.890/0001-23', source: 'Google Ads', notes: 'TMS + Integração' },
            { name: 'Hospital São Lucas', type: 'PJ', email: 'ti@hsaolucas.com.br', phone: '11954321098', city: 'São Paulo', cnpj: '45.678.901/0001-34', source: 'Evento', notes: 'Telemedicina + Prontuário' },
            { name: 'Varejo Nacional LTDA', type: 'PJ', email: 'comercial@varejonacional.com.br', phone: '11943210987', city: 'São Paulo', cnpj: '56.789.012/0001-45', source: 'Indicação', notes: 'E-commerce + ERP' },
            { name: 'Construtora Edificar', type: 'PJ', email: 'projetos@edificar.com.br', phone: '11932109876', city: 'Rio de Janeiro', cnpj: '67.890.123/0001-56', source: 'LinkedIn', notes: 'Gestão de Obras' },
            { name: 'Rede Educacional ABC', type: 'PJ', email: 'diretor@redeeducaabc.com.br', phone: '11921098765', city: 'Santo André', cnpj: '78.901.234/0001-67', source: 'Outbound', notes: 'LMS + Portal Alunos' },
            { name: 'Fintech Pay+', type: 'PJ', email: 'cto@fintechpay.com.br', phone: '11910987654', city: 'São Paulo', cnpj: '89.012.345/0001-78', source: 'Networking', notes: 'API Pagamentos' },
            { name: 'Agro Solutions', type: 'PJ', email: 'ti@agrosolutions.com.br', phone: '67909876543', city: 'Campo Grande', cnpj: '90.123.456/0001-89', source: 'Feira', notes: 'IoT + Analytics' },
            { name: 'Indústria Metalúrgica M', type: 'PJ', email: 'engenharia@metalurgicam.com.br', phone: '11898765432', city: 'Guarulhos', cnpj: '01.234.567/0001-90', source: 'Google', notes: 'Indústria 4.0 + MES' },
            { name: 'StartupXYZ', type: 'PJ', email: 'founder@startupxyz.io', phone: '11887654321', city: 'São Paulo', cnpj: '12.345.678/0001-02', source: 'Aceleradora', notes: 'MVP + Scaling' },
            { name: 'Energia Renovável SA', type: 'PJ', email: 'operacoes@energiarenovavel.com.br', phone: '21876543210', city: 'Rio de Janeiro', cnpj: '23.456.789/0001-13', source: 'LinkedIn', notes: 'SCADA + Monitoramento' },
        ];

        const clientIds = [];
        for (const c of clientesTech) {
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
            { name: 'Banco Tradicional BT', email: 'inovacao@bancotrad.com.br', phone: '11999112233', source: 'LinkedIn', product: 'Digital Transformation', value: 850000.00, status: 'new' },
            { name: 'Seguradora Prime', email: 'ti@seguradoraprime.com.br', phone: '11988223344', source: 'Indicação', product: 'Claims Automation', value: 450000.00, status: 'contacted' },
            { name: 'Operadora Saúde Plus', email: 'sistemas@saudeplus.com.br', phone: '11977334455', source: 'Evento', product: 'Telemedicine Platform', value: 680000.00, status: 'qualified' },
            { name: 'Grupo Varejo GV', email: 'ecommerce@grupogv.com.br', phone: '11966445566', source: 'Google Ads', product: 'E-commerce + OMS', value: 320000.00, status: 'negotiating' },
            { name: 'Transportes Rápidos', email: 'operacoes@transportesrapidos.com.br', phone: '11955556677', source: 'Cold Email', product: 'Fleet Management', value: 180000.00, status: 'won' },
            { name: 'Universidade Federal X', email: 'ti@univx.edu.br', phone: '31944667788', source: 'Licitação', product: 'Learning Platform', value: 520000.00, status: 'lost' },
            { name: 'Indústria Química QM', email: 'fabrica@industriaqm.com.br', phone: '19933778899', source: 'Feira', product: 'Industry 4.0', value: 890000.00, status: 'new' },
            { name: 'Cooperativa Agro', email: 'gestao@coopagro.com.br', phone: '66922889900', source: 'Indicação', product: 'Agtech Platform', value: 380000.00, status: 'contacted' },
            { name: 'Rede Clínicas Dr+', email: 'expansao@drmais.com.br', phone: '11911990011', source: 'Outbound', product: 'EHR + Scheduling', value: 290000.00, status: 'qualified' },
            { name: 'Construtora Grande Obra', email: 'engenharia@grandeobra.com.br', phone: '11900110022', source: 'LinkedIn', product: 'Construction ERP', value: 560000.00, status: 'negotiating' },
            { name: 'Fintech Crédito+', email: 'produto@creditomais.com.br', phone: '11899220033', source: 'Networking', product: 'Credit Scoring API', value: 750000.00, status: 'won' },
            { name: 'Telecom NewCom', email: 'infraestrutura@newcom.com.br', phone: '11888330044', source: 'RFP', product: 'BSS/OSS Integration', value: 1200000.00, status: 'new' },
        ];

        for (const l of leadsData) {
            await db.opsQuery(`
        INSERT INTO leads (tenant_id, name, email, phone, source, product_interest, value, status, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [tenantId, l.name, l.email, l.phone, l.source, l.product, l.value, l.status,
                ['tech', 'saas', l.value > 500000 ? 'enterprise' : 'mid-market']]);
        }
        console.log(`  ✅ ${leadsData.length} leads criados`);

        // ===== FINANCIAL TRANSACTIONS =====
        const transactions = [
            // Receita Recorrente SaaS (income)
            { desc: 'MRR - Banco Digital X - Nov', amount: 45000.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'MRR - Seguros Brasil - Nov', amount: 28000.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'MRR - Logística Express - Nov', amount: 15000.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'MRR - Hospital São Lucas - Nov', amount: 35000.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'MRR - Varejo Nacional - Nov', amount: 22000.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'MRR - Construtora Edificar - Nov', amount: 12000.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'MRR - Rede Educacional - Nov', amount: 18000.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'MRR - Fintech Pay+ - Nov', amount: 8500.00, type: 'income', date: '2024-11-05', status: 'paid' },
            // Projetos e Setup (income)
            { desc: 'Setup Fee - Agro Solutions', amount: 85000.00, type: 'income', date: '2024-11-10', status: 'paid' },
            { desc: 'Projeto Integração - Metalúrgica M', amount: 120000.00, type: 'income', date: '2024-11-12', status: 'paid' },
            { desc: 'Consultoria - StartupXYZ', amount: 45000.00, type: 'income', date: '2024-11-15', status: 'paid' },
            { desc: 'Professional Services - Energia SA', amount: 78000.00, type: 'income', date: '2024-11-18', status: 'paid' },
            { desc: 'Upsell - Banco Digital X - Módulo AI', amount: 180000.00, type: 'income', date: '2024-11-20', status: 'paid' },
            { desc: 'Onboarding - Novo Cliente - Nov', amount: 65000.00, type: 'income', date: '2024-11-22', status: 'paid' },
            { desc: 'Support Premium - Q4', amount: 95000.00, type: 'income', date: '2024-11-25', status: 'pending' },
            // Custos operacionais (expense)
            { desc: 'AWS/Cloud Infrastructure - Nov', amount: 85000.00, type: 'expense', date: '2024-11-01', status: 'paid' },
            { desc: 'Salários Dev Team - Nov', amount: 280000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Google Workspace - Nov', amount: 4500.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Marketing Digital - Nov', amount: 65000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Aluguel Escritório - Nov', amount: 35000.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Ferramentas Dev (Jira, GitHub, etc)', amount: 8500.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Customer Success Team - Nov', amount: 120000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Treinamentos e Certificações', amount: 15000.00, type: 'expense', date: '2024-11-15', status: 'paid' },
            { desc: 'Eventos e Networking', amount: 25000.00, type: 'expense', date: '2024-11-20', status: 'paid' },
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
            { device: 'Desktop', percentage: 68.5, conversions: 892 },
            { device: 'Mobile', percentage: 26.2, conversions: 342 },
            { device: 'Tablet', percentage: 5.3, conversions: 69 },
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
            { content: '🚀 Case Study: Como ajudamos o Banco Digital X a reduzir 40% do tempo de processamento com IA. #fintech #ai', platform: 'linkedin', status: 'published', date: '2024-11-18 10:00:00' },
            { content: 'Novo lançamento: Módulo de Inteligência Artificial para previsão de demanda! 🤖 Saiba mais no link.', platform: 'linkedin', status: 'published', date: '2024-11-20 11:00:00' },
            { content: 'TechNova foi reconhecida como Great Place to Work 2024! 🏆 Orgulho do nosso time!', platform: 'instagram', status: 'published', date: '2024-11-22 14:00:00' },
            { content: '📊 Relatório: Tendências de Transformação Digital 2025. Download gratuito disponível!', platform: 'linkedin', status: 'published', date: '2024-11-25 09:00:00' },
            { content: 'Bastidores: Um dia na vida do nosso time de Product. Conheça como criamos inovação! 🎬', platform: 'youtube', status: 'published', date: '2024-11-27 15:00:00' },
            { content: '🎄 Retrospectiva 2024: Nossos principais marcos e conquistas. Obrigado clientes e parceiros!', platform: 'linkedin', status: 'scheduled', date: '2024-12-15 10:00:00' },
            { content: 'WEBINAR: Arquitetura de Microsserviços para Escala. Inscreva-se gratuitamente!', platform: 'linkedin', status: 'scheduled', date: '2024-12-10 09:00:00' },
        ];

        for (const p of socialPosts) {
            await db.opsQuery(`
        INSERT INTO social_posts (client_id, content, platform, status, scheduled_date)
        VALUES ($1, $2, $3, $4, $5)
      `, [clientIds[0] || 1, p.content, p.platform, p.status, p.date]);
        }
        console.log(`  ✅ ${socialPosts.length} posts sociais criados`);

        console.log('✅ Seed Tecnologia/Serviços concluído!\n');
        return { tenantId, clientIds };

    } catch (error) {
        console.error('❌ Erro no seed Tecnologia:', error);
        throw error;
    }
};

module.exports = seedTecnologia;

if (require.main === module) {
    seedTecnologia()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
