const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Tentar carregar .env de múltiplos locais
const envPaths = [
    path.join(__dirname, '../.env'), // backend/.env
    path.join(__dirname, '../../.env') // root/.env
];

for (const p of envPaths) {
    const result = dotenv.config({ path: p });
    if (!result.error) {
        console.log(`✅ Loaded .env from ${p}`);
        break;
    }
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const INDUSTRY_TEMPLATES = {
    'Technology': [
        "Descubra como a IA pode transformar seu negócio! 🤖 #inovação #tech",
        "Segurança cibernética é prioridade. Proteja seus dados hoje. 🔒",
        "Novas tendências em desenvolvimento de software para 2025. 💻",
        "A nuvem é o futuro. Migre sua infraestrutura com segurança. ☁️",
        "Automação de processos: economize tempo e recursos. ⚙️",
        "Conheça nosso novo dashboard de analytics em tempo real. 📊",
        "5 dicas para otimizar seu fluxo de trabalho digital. 🚀",
        "O impacto do 5G na indústria 4.0. 📡",
        "Transformação digital: por onde começar? 🤔",
        "Estamos contratando devs! Junte-se ao nosso time. 👩‍💻👨‍💻"
    ],
    'Food': [
        "Pão quentinho saindo do forno agora! 🥖 #padaria #fome",
        "Já provou nosso novo bolo de chocolate? É irresistível! 🍰",
        "Café da manhã especial todos os dias até as 11h. ☕",
        "Ingredientes frescos e selecionados para você. 🥗",
        "Faça sua encomenda para festas e eventos! 🎉",
        "Receita do dia: Como fazer um sanduíche gourmet em casa. 🥪",
        "Promoção de happy hour: pague 1 leve 2. 🍻",
        "Sabor que traz memórias da infância. ❤️",
        "Opções veganas e sem glúten disponíveis! 🌱",
        "Venha experimentar nosso almoço executivo. 🍽️"
    ],
    'Retail': [
        "Nova coleção de verão chegou! Venha conferir. ☀️ #moda #estilo",
        "Liquidação total: até 50% de desconto em peças selecionadas. 🏷️",
        "Dicas de look para arrasar no fim de semana. 👗",
        "Acessórios que fazem a diferença no seu visual. 💍",
        "Frete grátis para compras acima de R$ 200. 🚚",
        "Tendências da moda internacional na sua vitrine. 🌍",
        "Presenteie quem você ama com nossos kits especiais. 🎁",
        "Renove seu guarda-roupa com estilo e economia. 💸",
        "Sapatos confortáveis para o dia a dia. 👟",
        "Últimas unidades! Garanta o seu antes que acabe. ⏳"
    ],
    'Health': [
        "Cuide da sua saúde mental. Tire um tempo para você. 🧘‍♀️ #bemestar",
        "Dicas para manter uma alimentação equilibrada. 🍎",
        "A importância do check-up anual. Previna-se! 🩺",
        "Exercícios físicos: comece hoje mesmo. 🏃‍♂️",
        "Hidratação é fundamental. Beba água! 💧",
        "Conheça nossos tratamentos estéticos avançados. ✨",
        "Dormir bem é essencial para a saúde. Veja dicas. 😴",
        "Vacinação em dia? Proteja você e sua família. 💉",
        "Sorria! A saúde bucal impacta todo o corpo. 🦷",
        "Agende sua consulta online com facilidade. 📅"
    ],
    'Finance': [
        "Invista no seu futuro. Comece a poupar hoje. 💰 #finanças",
        "Como declarar seu imposto de renda sem dor de cabeça. 📝",
        "Análise de mercado: o que esperar para o próximo trimestre? 📈",
        "Planejamento financeiro para pequenas empresas. 🏢",
        "Diversifique seus investimentos e reduza riscos. ⚖️",
        "Crédito consciente: use a seu favor. 💳",
        "Aposentadoria tranquila: saiba como planejar. 🏖️",
        "Entenda as taxas de juros e economize. 📉",
        "Consultoria financeira personalizada para você. 🤝",
        "Proteja seu patrimônio com nossos seguros. 🛡️"
    ],
    'General': [
        "Desejamos a todos uma excelente semana! ✨",
        "Fique ligado nas novidades que vêm por aí. 👀",
        "Agradecemos a confiança de nossos clientes. 🙏",
        "Qualidade e compromisso em primeiro lugar. 🏆",
        "Estamos atendendo em novo horário. Confira! ⏰",
        "Siga-nos nas redes sociais para mais atualizações. 📱",
        "Feedback de cliente: 'Adorei o serviço!' ⭐⭐⭐⭐⭐",
        "Parceria de sucesso: Juntos vamos mais longe. 🤝",
        "Bastidores do nosso dia a dia. 🎥",
        "Entre em contato conosco para saber mais. 📞"
    ]
};

function getIndustryByClientName(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('tech') || lowerName.includes('soft') || lowerName.includes('web') || lowerName.includes('digital') || lowerName.includes('data')) return 'Technology';
    if (lowerName.includes('padaria') || lowerName.includes('restaurante') || lowerName.includes('food') || lowerName.includes('café') || lowerName.includes('doce')) return 'Food';
    if (lowerName.includes('loja') || lowerName.includes('moda') || lowerName.includes('store') || lowerName.includes('boutique')) return 'Retail';
    if (lowerName.includes('saude') || lowerName.includes('clínica') || lowerName.includes('med') || lowerName.includes('farma') || lowerName.includes('odonto')) return 'Health';
    if (lowerName.includes('finan') || lowerName.includes('bank') || lowerName.includes('invest') || lowerName.includes('contabil')) return 'Finance';
    return 'General';
}

async function seedSocialData() {
    const client = await pool.connect();
    try {
        console.log('🌱 Iniciando seed inteligente de dados Sociais...');

        // 1. Buscar todos os clientes
        const clientsRes = await client.query('SELECT id, name, industry FROM clients');
        const clients = clientsRes.rows;

        if (clients.length === 0) {
            console.log('⚠️ Nenhum cliente encontrado.');
            return;
        }

        console.log(`📋 Processando ${clients.length} clientes...`);

        // Limpar posts antigos
        await client.query('DELETE FROM social_posts');
        console.log('🧹 Tabela social_posts limpa.');

        for (const c of clients) {
            // Determinar indústria
            let industry = c.industry;
            if (!industry || !INDUSTRY_TEMPLATES[industry]) {
                industry = getIndustryByClientName(c.name);
                // Atualizar cliente com a indústria inferida (opcional, mas bom)
                await client.query('UPDATE clients SET industry = $1 WHERE id = $2', [industry, c.id]);
            }

            console.log(`   Processing Client: ${c.name} (ID: ${c.id}) -> Industry: ${industry}`);

            const templates = INDUSTRY_TEMPLATES[industry] || INDUSTRY_TEMPLATES['General'];
            const numPosts = Math.floor(Math.random() * 20) + 10; // 10 a 30 posts

            for (let i = 0; i < numPosts; i++) {
                const template = templates[Math.floor(Math.random() * templates.length)];

                // Gerar data aleatória (últimos 30 dias e próximos 30 dias)
                const today = new Date();
                const dateOffset = Math.floor(Math.random() * 60) - 30;
                const postDate = new Date(today);
                postDate.setDate(today.getDate() + dateOffset);

                const isPast = postDate < new Date();
                const status = isPast ? 'published' : (Math.random() > 0.3 ? 'scheduled' : 'draft');
                const platform = ['instagram', 'facebook', 'linkedin', 'twitter'][Math.floor(Math.random() * 4)];

                const likes = status === 'published' ? Math.floor(Math.random() * 500) : 0;
                const comments = status === 'published' ? Math.floor(Math.random() * 50) : 0;
                const shares = status === 'published' ? Math.floor(Math.random() * 20) : 0;

                await client.query(`
                    INSERT INTO social_posts (client_id, content, platform, scheduled_date, status, likes, comments, shares)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [c.id, template, platform, postDate, status, likes, comments, shares]);
            }
        }

        console.log('✅ Seed Social Data concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro no seed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

seedSocialData();
