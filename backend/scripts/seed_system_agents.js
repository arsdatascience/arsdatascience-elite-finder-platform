const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const executeTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const seedSystemAgents = async () => {
    console.log('🌱 Seeding System Agents...');
    try {
        await executeTransaction(async (client) => {

            // 1. Define System Agents
            const agents = [
                {
                    slug: 'agent-elite-assistant',
                    name: 'Elite Assistant',
                    description: 'Especialista em Estratégia de Marketing e Vendas (Elite Strategist).',
                    category: 'system_core',
                    systemPrompt: `Você é o **Elite Strategist**, um Especialista Sênior em Marketing Digital e Vendas da plataforma 'EliteFinder'.\n\n🎯 **DIRETRIZES DE RESPOSTA:**\n- Atue como um consultor experiente: seja estratégico, direto e prático.\n- Quando o usuário pedir ideias, forneça listas estruturadas.\n- Responda sempre em **Português do Brasil** com tom profissional mas acessível.`,
                    aiConfig: { model: 'gpt-4o', temperature: 0.7, provider: 'openai' }
                },
                {
                    slug: 'agent-sales-coach',
                    name: 'Sales Coaching Master',
                    description: 'Analista de conversas de vendas e comportamento do consumidor.',
                    category: 'system_core',
                    systemPrompt: `Atue como um Diretor de Estratégia Comercial e Marketing Sênior. Analise conversas entre Agente e Cliente.\nIdentifique: Sentimento, Objeções, Estágio de Compra e Próxima Melhor Ação.\nSeu objetivo é aumentar a taxa de conversão do vendedor.`,
                    aiConfig: { model: 'gpt-4o', temperature: 0.5, provider: 'openai', jsonMode: true }
                },
                {
                    slug: 'agent-creative-director',
                    name: 'Creative Studio Director',
                    description: 'Copywriter de Elite mundial (nível Ogilvy).',
                    category: 'system_core',
                    systemPrompt: `Você é um Copywriter de Elite de classe mundial.\nTAREFA: Criar conteúdo de marketing de alta conversão.\nREGRAS:\n1. Use gatilhos mentais (urgência, escassez).\n2. Gere 3 opções de Headlines.\n3. Sugira ideia visual clara.`,
                    aiConfig: { model: 'gpt-4o', temperature: 0.8, provider: 'openai', jsonMode: true }
                },
                {
                    slug: 'agent-chat-ai',
                    name: 'Chat AI Generalist',
                    description: 'Assistente geral para dúvidas diversas.',
                    category: 'system_core',
                    systemPrompt: `Você é um assistente virtual útil e versátil.`,
                    aiConfig: { model: 'gpt-4o', temperature: 0.7, provider: 'openai' }
                },
                {
                    slug: 'agent-audio-analyst',
                    name: 'Audio Analyst',
                    description: 'Especialista em transcição e análise de sentimentos em áudio.',
                    category: 'system_core',
                    systemPrompt: `Você é um especialista em análise de áudio. Transcreva com precisão e detecte as emoções dos falantes.`,
                    aiConfig: { model: 'whisper-1', temperature: 0.2, provider: 'openai' }
                },
                {
                    slug: 'agent-system-brain',
                    name: 'System Brain (Orchestrator)',
                    description: 'Orquestrador central do sistema.',
                    category: 'system_core',
                    systemPrompt: `Você é o cérebro do sistema. Sua função é rotear pedidos para o agente correto.`,
                    aiConfig: { model: 'gpt-4o', temperature: 0.0, provider: 'openai' }
                }
            ];

            for (const agent of agents) {
                // Upsert Chatbot
                console.log(`Processing: ${agent.name}`);

                // Check if exists
                const res = await client.query('SELECT id FROM chatbots WHERE slug = $1', [agent.slug]);
                let agentId;

                if (res.rows.length === 0) {
                    const insert = await client.query(`
                        INSERT INTO chatbots (name, description, category, slug, status, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
                        RETURNING id
                    `, [agent.name, agent.description, agent.category, agent.slug]);
                    agentId = insert.rows[0].id;
                } else {
                    agentId = res.rows[0].id;
                    // Optional: Update name/desc if needed, but risky for user customization
                }

                // Upsert AI Config
                const checkAi = await client.query('SELECT id FROM agent_ai_configs WHERE chatbot_id = $1', [agentId]);
                if (checkAi.rows.length === 0) {
                    await client.query(`
                        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature, json_mode)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [agentId, agent.aiConfig.provider, agent.aiConfig.model, agent.aiConfig.temperature, agent.aiConfig.jsonMode || false]);
                }

                // Upsert Prompts
                const checkPrompt = await client.query('SELECT id FROM agent_prompts WHERE chatbot_id = $1', [agentId]);
                if (checkPrompt.rows.length === 0) {
                    await client.query(`
                        INSERT INTO agent_prompts (chatbot_id, system_prompt)
                        VALUES ($1, $2)
                    `, [agentId, agent.systemPrompt]);
                }
            }
        });
        console.log('✅ System Agents Seeded Automatically!');
    } catch (err) {
        console.error('❌ Error seeding agents:', err);
    } finally {
        pool.end();
    }
};

seedSystemAgents();
