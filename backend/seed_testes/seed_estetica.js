/**
 * SEED: Clínica de Estética
 * Dados sintéticos para clínica de estética/spa/beleza
 * Vertical: Saúde & Beleza
 */

const db = require('../database');

const seedEstetica = async () => {
    console.log('💆 Iniciando seed Clínica de Estética...');

    try {
        // ===== TENANT =====
        const tenantResult = await db.opsQuery(`
      INSERT INTO tenants (name, cnpj, email, phone, address_city, address_state, plan_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, ['Beleza & Estética Premium', '98.765.432/0001-10', 'contato@belezapremium.com.br', '(11) 3456-7890',
            'São Paulo', 'SP', 3, 'active']);

        const tenantId = tenantResult.rows[0]?.id || 2;
        console.log(`  ✅ Tenant criado: ID ${tenantId}`);

        // ===== CLIENTS (Pacientes) =====
        const clientesEstetica = [
            { name: 'Adriana Campos', type: 'PF', email: 'adriana.campos@gmail.com', phone: '11987654321', city: 'São Paulo', state: 'SP', gender: 'Feminino', notes: 'Interesse em harmonização facial', source: 'Instagram' },
            { name: 'Renata Vieira', type: 'PF', email: 'renata.vieira@hotmail.com', phone: '11976543210', city: 'São Paulo', state: 'SP', gender: 'Feminino', notes: 'Cliente VIP - pacote anual', source: 'Indicação' },
            { name: 'Luciana Borges', type: 'PF', email: 'luciana.b@gmail.com', phone: '11965432109', city: 'Guarulhos', state: 'SP', gender: 'Feminino', notes: 'Tratamento de acne - sessão 4/10', source: 'Google' },
            { name: 'Patricia Duarte', type: 'PF', email: 'patricia.duarte@yahoo.com', phone: '11954321098', city: 'Santo André', state: 'SP', gender: 'Feminino', notes: 'Laser CO2 - acompanhamento', source: 'Facebook' },
            { name: 'Carolina Mendes', type: 'PF', email: 'carol.mendes@icloud.com', phone: '11943210987', city: 'São Bernardo', state: 'SP', gender: 'Feminino', notes: 'Botox preventivo', source: 'Instagram' },
            { name: 'Marcelo Prado', type: 'PF', email: 'marcelo.prado@gmail.com', phone: '11932109876', city: 'Alphaville', state: 'SP', gender: 'Masculino', notes: 'Tratamento capilar - PRP', source: 'YouTube' },
            { name: 'Fernanda Rocha', type: 'PF', email: 'fernanda.rocha@outlook.com', phone: '11921098765', city: 'Moema', state: 'SP', gender: 'Feminino', notes: 'Limpeza de pele mensal', source: 'Indicação' },
            { name: 'Jessica Lima', type: 'PF', email: 'jessica.lima@gmail.com', phone: '11910987654', city: 'Pinheiros', state: 'SP', gender: 'Feminino', notes: 'Depilação a laser - corpo todo', source: 'Google' },
            { name: 'Roberta Santos', type: 'PF', email: 'roberta.s@terra.com.br', phone: '11909876543', city: 'Jardins', state: 'SP', gender: 'Feminino', notes: 'Peeling químico - programa completo', source: 'Instagram' },
            { name: 'Daniela Costa', type: 'PF', email: 'daniela.costa@gmail.com', phone: '11898765432', city: 'Itaim Bibi', state: 'SP', gender: 'Feminino', notes: 'Criolipólise - 3 sessões', source: 'Meta Ads' },
            { name: 'Gustavo Almeida', type: 'PF', email: 'gustavo.almeida@hotmail.com', phone: '11887654321', city: 'Vila Olímpia', state: 'SP', gender: 'Masculino', notes: 'Depilação a laser masculina', source: 'TikTok' },
            { name: 'Amanda Torres', type: 'PF', email: 'amanda.t@gmail.com', phone: '11876543210', city: 'Brooklin', state: 'SP', gender: 'Feminino', notes: 'Microagulhamento - cicatrizes', source: 'Indicação' },
        ];

        const clientIds = [];
        for (const c of clientesEstetica) {
            const res = await db.crossoverQuery(`
        INSERT INTO clients (tenant_id, name, type, email, phone, address_city, address_state, gender, notes, referral_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [tenantId, c.name, c.type, c.email, c.phone, c.city, c.state, c.gender, c.notes, c.source]);
            if (res.rows[0]) clientIds.push(res.rows[0].id);
        }
        console.log(`  ✅ ${clientIds.length} clientes/pacientes criados`);

        // ===== LEADS =====
        const leadsData = [
            { name: 'Camila Freitas', email: 'camila.freitas@gmail.com', phone: '11999112233', source: 'Instagram', product: 'Harmonização Facial', value: 3500.00, status: 'new' },
            { name: 'Vanessa Lopes', email: 'vanessa.l@hotmail.com', phone: '11988223344', source: 'Google Ads', product: 'Botox Full Face', value: 2200.00, status: 'contacted' },
            { name: 'Juliana Martins', email: 'juliana.m@yahoo.com', phone: '11977334455', source: 'Facebook', product: 'Preenchimento Labial', value: 1800.00, status: 'qualified' },
            { name: 'Beatriz Alves', email: 'bia.alves@gmail.com', phone: '11966445566', source: 'Indicação', product: 'Bioestimulador Sculptra', value: 4500.00, status: 'negotiating' },
            { name: 'Mariana Cunha', email: 'mariana.c@icloud.com', phone: '11955556677', source: 'Instagram', product: 'Depilação Laser Completa', value: 6000.00, status: 'won' },
            { name: 'Leticia Ramos', email: 'leticia.r@outlook.com', phone: '11944667788', source: 'WhatsApp', product: 'Tratamento Acne', value: 2800.00, status: 'lost' },
            { name: 'Priscila Dias', email: 'priscila.d@gmail.com', phone: '11933778899', source: 'TikTok', product: 'Peeling de Diamante', value: 450.00, status: 'new' },
            { name: 'Aline Barbosa', email: 'aline.b@terra.com.br', phone: '11922889900', source: 'YouTube', product: 'Criolipólise Abdomen', value: 2500.00, status: 'contacted' },
            { name: 'Thais Oliveira', email: 'thais.oliveira@gmail.com', phone: '11911990011', source: 'Google', product: 'Limpeza de Pele Premium', value: 380.00, status: 'qualified' },
            { name: 'Ricardo Neves', email: 'ricardo.neves@hotmail.com', phone: '11900110022', source: 'Instagram', product: 'PRP Capilar', value: 1500.00, status: 'won' },
            { name: 'Eduardo Mello', email: 'eduardo.m@gmail.com', phone: '11899220033', source: 'Orgânico', product: 'Laser Corporal', value: 3200.00, status: 'negotiating' },
            { name: 'Gabriela Pinto', email: 'gabriela.p@yahoo.com', phone: '11888330044', source: 'Meta Ads', product: 'Microagulhamento', value: 980.00, status: 'new' },
        ];

        for (const l of leadsData) {
            await db.opsQuery(`
        INSERT INTO leads (tenant_id, name, email, phone, source, product_interest, value, status, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [tenantId, l.name, l.email, l.phone, l.source, l.product, l.value, l.status,
                ['estética', 'beleza', l.product.toLowerCase().split(' ')[0]]]);
        }
        console.log(`  ✅ ${leadsData.length} leads criados`);

        // ===== FINANCIAL TRANSACTIONS =====
        const transactions = [
            // Receitas de procedimentos (income)
            { desc: 'Harmonização Facial - Adriana C.', amount: 3500.00, type: 'income', date: '2024-11-01', status: 'paid' },
            { desc: 'Botox Full Face - Renata V.', amount: 2200.00, type: 'income', date: '2024-11-02', status: 'paid' },
            { desc: 'Preenchimento Labial - Luciana B.', amount: 1800.00, type: 'income', date: '2024-11-03', status: 'paid' },
            { desc: 'Depilação Laser Pernas - Patricia D.', amount: 890.00, type: 'income', date: '2024-11-04', status: 'paid' },
            { desc: 'Limpeza de Pele Premium - Carolina M.', amount: 380.00, type: 'income', date: '2024-11-05', status: 'paid' },
            { desc: 'Sculptra 4 frascos - Fernanda R.', amount: 7200.00, type: 'income', date: '2024-11-06', status: 'paid' },
            { desc: 'Peeling Químico - Jessica L.', amount: 650.00, type: 'income', date: '2024-11-08', status: 'paid' },
            { desc: 'Criolipólise Abdomen - Roberta S.', amount: 2500.00, type: 'income', date: '2024-11-10', status: 'paid' },
            { desc: 'PRP Capilar - Marcelo P.', amount: 1500.00, type: 'income', date: '2024-11-12', status: 'paid' },
            { desc: 'Microagulhamento Face - Daniela C.', amount: 980.00, type: 'income', date: '2024-11-14', status: 'paid' },
            { desc: 'Laser CO2 Fracionado - Amanda T.', amount: 2800.00, type: 'income', date: '2024-11-16', status: 'paid' },
            { desc: 'Depilação Masculina - Gustavo A.', amount: 450.00, type: 'income', date: '2024-11-18', status: 'paid' },
            { desc: 'Pacote VIP Anual - Cliente Premium', amount: 24000.00, type: 'income', date: '2024-11-20', status: 'paid' },
            { desc: 'Tratamento Acne 5 sessões', amount: 2800.00, type: 'income', date: '2024-11-22', status: 'pending' },
            { desc: 'Drenagem Linfática Pacote', amount: 1200.00, type: 'income', date: '2024-11-25', status: 'paid' },
            // Custos operacionais (expense)
            { desc: 'Insumos - Ácido Hialurônico', amount: 8500.00, type: 'expense', date: '2024-11-01', status: 'paid' },
            { desc: 'Toxina Botulínica - Distribuidora', amount: 12000.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Instagram Ads - Novembro', amount: 4500.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Google Ads - Novembro', amount: 3200.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Aluguel Clínica - Nov', amount: 15000.00, type: 'expense', date: '2024-11-05', status: 'paid' },
            { desc: 'Equipamento Laser - Parcela 12/24', amount: 4500.00, type: 'expense', date: '2024-11-10', status: 'paid' },
            { desc: 'Folha de Pagamento - Nov', amount: 28000.00, type: 'expense', date: '2024-11-30', status: 'paid' },
            { desc: 'Material de Consumo', amount: 3200.00, type: 'expense', date: '2024-11-15', status: 'paid' },
            { desc: 'CRM Digital - Mensalidade', amount: 890.00, type: 'expense', date: '2024-11-05', status: 'paid' },
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
            { device: 'Mobile', percentage: 78.2, conversions: 523 },
            { device: 'Desktop', percentage: 16.5, conversions: 112 },
            { device: 'Tablet', percentage: 5.3, conversions: 36 },
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
            { content: '✨ ANTES E DEPOIS: Harmonização Facial sutil e natural! Agende sua avaliação gratuita. #harmonizacaofacial #estetica', platform: 'instagram', status: 'published', date: '2024-11-18 10:00:00' },
            { content: 'DEZEMBRO DE BELEZA! 🎄 20% OFF em todos os tratamentos faciais. Promoção válida até 31/12', platform: 'instagram', status: 'published', date: '2024-11-22 14:00:00' },
            { content: 'Qual procedimento você quer conhecer melhor? Responde aqui! 👇 1️⃣ Botox 2️⃣ Preenchimento 3️⃣ Bioestimulador', platform: 'instagram', status: 'published', date: '2024-11-25 16:00:00' },
            { content: 'Dr. Ricardo explica: A diferença entre Botox e Preenchimento. Assista agora!', platform: 'youtube', status: 'published', date: '2024-11-26 18:00:00' },
            { content: 'RESULTADO REAL: Cliente após 3 sessões de tratamento para acne. Sem filtro! 🙌', platform: 'tiktok', status: 'published', date: '2024-11-28 15:00:00' },
            { content: '🎁 SORTEIO DE NATAL: Ganhe 1 sessão de Limpeza de Pele Premium! Participe agora.', platform: 'instagram', status: 'scheduled', date: '2024-12-05 10:00:00' },
            { content: 'VAGAS LIMITADAS: Pacote de Verão com depilação a laser! ☀️', platform: 'facebook', status: 'scheduled', date: '2024-12-10 11:00:00' },
        ];

        for (const p of socialPosts) {
            await db.opsQuery(`
        INSERT INTO social_posts (client_id, content, platform, status, scheduled_date)
        VALUES ($1, $2, $3, $4, $5)
      `, [clientIds[0] || 1, p.content, p.platform, p.status, p.date]);
        }
        console.log(`  ✅ ${socialPosts.length} posts sociais criados`);

        console.log('✅ Seed Clínica de Estética concluído!\n');
        return { tenantId, clientIds };

    } catch (error) {
        console.error('❌ Erro no seed Estética:', error);
        throw error;
    }
};

module.exports = seedEstetica;

if (require.main === module) {
    seedEstetica()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
