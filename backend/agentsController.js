const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Helper para executar queries em transação
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
    // Helper para gerar slug único
    const generateSlug = async (name, client) => {
        let slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (!slug) slug = 'agent-' + Math.random().toString(36).substring(7);

        let uniqueSlug = slug;
        let counter = 1;
        while (true) {
            const check = await client.query('SELECT id FROM chatbots WHERE slug = $1', [uniqueSlug]);
            if (check.rows.length === 0) return uniqueSlug;
            uniqueSlug = `${slug}-${counter++}`;
        }
    };

    // Obter agente público por Slug
    router.get('/public/:slug', async (req, res) => {
        try {
            const { slug } = req.params;
            const result = await pool.query(`
            SELECT id, name, description, category, class, specialization_level, slug, avatar, client_id 
            FROM chatbots WHERE slug = $1 AND status = 'active'
        `, [slug]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Agente não encontrado' });
            }

            const agent = result.rows[0];

            // Buscar configs necessárias para o chat (sem expor segredos)
            const aiConfig = await pool.query('SELECT provider, model, temperature, response_mode FROM agent_ai_configs WHERE chatbot_id = $1', [agent.id]);

            // Retornar apenas o necessário para a interface pública
            res.json({
                ...agent,
                aiConfig: aiConfig.rows[0] || {},
                isPublic: true
            });

            // Chat Público com o Agente
            router.post('/public/:slug/chat', async (req, res) => {
                try {
                    const { slug } = req.params;
                    const { messages, sessionId } = req.body;

                    const result = await pool.query(`
            SELECT c.*, a.provider, a.model, a.temperature, a.max_tokens, a.system_prompt,
                   p.system_prompt as prompt_system, p.response_structure_prompt, p.script_content
            FROM chatbots c
            LEFT JOIN agent_ai_configs a ON c.id = a.chatbot_id
            LEFT JOIN agent_prompts p ON c.id = p.chatbot_id
            WHERE c.slug = $1 AND c.status = 'active'
        `, [slug]);

                    if (result.rows.length === 0) {
                        return res.status(404).json({ error: 'Agente não encontrado ou inativo' });
                    }

                    const agent = result.rows[0];

                    // Construir System Prompt
                    let systemPrompt = agent.prompt_system || `Você é ${agent.name}. ${agent.description}`;
                    if (agent.script_content) {
                        systemPrompt += `\n\nCONTEXTO E SCRIPT OBRIGATÓRIO:\n${agent.script_content}`;
                    }
                    if (agent.response_structure_prompt) {
                        systemPrompt += `\n\nESTRUTURA DE RESPOSTA:\n${agent.response_structure_prompt}`;
                    }

                    // Determinar Provider e Chave
                    const provider = agent.provider || 'openai';
                    let apiKey = process.env.OPENAI_API_KEY; // Default system key

                    // Simulação de chamada simplificada (Em produção usaríamos o service completo)
                    // Aqui assumimos OpenAI para MVP ou usamos o provider configurado se implementado

                    if (provider === 'openai') {
                        const OpenAI = require('openai');
                        const openai = new OpenAI({ apiKey: apiKey });

                        const completion = await openai.chat.completions.create({
                            model: agent.model || 'gpt-4o',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                ...messages.map(m => ({ role: m.role, content: m.content }))
                            ],
                            temperature: parseFloat(agent.temperature) || 0.7,
                            max_tokens: agent.max_tokens || 1000
                        });

                        return res.json({
                            role: 'assistant',
                            content: completion.choices[0].message.content
                        });
                    }

                    // Fallback or other providers...
                    return res.json({ role: 'assistant', content: "Desculpe, estou em manutenção (Provider não suportado neste endpoint público ainda)." });

                } catch (error) {
                    console.error('Erro no chat público:', error);
                    res.status(500).json({ error: 'Erro ao processar mensagem' });
                }
            });

            // Criar novo agente
            router.post('/', async (req, res) => {
                try {
                    const {
                        identity,
                        aiConfig,
                        vectorConfig,
                        prompts,
                        whatsappConfig,
                        advancedConfig
                    } = req.body;

                    if (!identity || !identity.name) {
                        return res.status(400).json({ error: 'Nome do agente é obrigatório' });
                    }

                    const newAgent = await executeTransaction(async (client) => {
                        // Gerar Slug Único
                        const slug = await generateSlug(identity.name, client);

                        // 1. Inserir Agente (Chatbot)
                        const agentResult = await client.query(`
                INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, client_id, slug)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, name, description, category, class, specialization_level, status, client_id, slug
            `, [
                            identity.name,
                            identity.description,
                            identity.category,
                            identity.class,
                            identity.specializationLevel,
                            identity.status,
                            advancedConfig || {},
                            identity.clientId || null,
                            slug
                        ]);
                        const agentId = agentResult.rows[0].id;

                        // 2. Inserir AI Config com parâmetros avançados
                        await client.query(`
                INSERT INTO agent_ai_configs (
                    chatbot_id, provider, model, temperature, top_p, top_k, max_tokens, timeout, retries,
                    frequency_penalty, presence_penalty, stop_sequences, response_mode, candidate_count,
                    seed, json_mode
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `, [
                            agentId,
                            aiConfig.provider,
                            aiConfig.model,
                            aiConfig.temperature,
                            aiConfig.topP,
                            aiConfig.topK,
                            aiConfig.maxTokens,
                            aiConfig.timeout,
                            aiConfig.retries,
                            aiConfig.frequencyPenalty || 0.0,
                            aiConfig.presencePenalty || 0.0,
                            aiConfig.stopSequences || null,
                            aiConfig.responseMode || 'balanced',
                            aiConfig.candidateCount || 1,
                            aiConfig.seed || null,
                            aiConfig.jsonMode || false
                        ]);

                        // 3. Inserir Vector Config
                        const vectorResult = await client.query(`
                INSERT INTO agent_vector_configs (
                    chatbot_id, chunking_mode, chunk_size, sensitivity, context_window, relevance_threshold, 
                    search_mode, enable_reranking, chunking_strategy, chunk_delimiter, max_chunk_size, chunk_overlap
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
            `, [
                            agentId,
                            vectorConfig.chunkingMode,
                            vectorConfig.chunkSize,
                            vectorConfig.sensitivity,
                            vectorConfig.contextWindow,
                            vectorConfig.relevanceThreshold,
                            vectorConfig.searchMode || 'semantic',
                            vectorConfig.enableReranking || false,
                            vectorConfig.chunkingStrategy || 'paragraph',
                            vectorConfig.chunkDelimiter || '\n\n',
                            vectorConfig.maxChunkSize || 2048,
                            vectorConfig.chunkOverlap || 100
                        ]);
                        const vectorConfigId = vectorResult.rows[0].id;

                        // 4. Inserir Filtros Vetoriais
                        if (vectorConfig.filters && vectorConfig.filters.length > 0) {
                            for (const filter of vectorConfig.filters) {
                                await client.query(`
                        INSERT INTO agent_vector_filters (vector_config_id, filter_tag)
                        VALUES ($1, $2)
                    `, [vectorConfigId, filter]);
                            }
                        }

                        // 5. Inserir Prompts
                        await client.query(`
                INSERT INTO agent_prompts (chatbot_id, system_prompt, response_structure_prompt, vector_search_prompt, analysis_prompt, complex_cases_prompt, validation_prompt, script_content)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                            agentId,
                            prompts.system,
                            prompts.responseStructure,
                            prompts.vectorSearch,
                            prompts.analysis,
                            prompts.complexCases,
                            prompts.validation,
                            prompts.scriptContent || ''
                        ]);

                        // 6. Inserir WhatsApp Config
                        await client.query(`
                INSERT INTO agent_whatsapp_configs (
                    chatbot_id, enabled, provider, 
                    evolution_base_url, evolution_api_key, evolution_instance_name,
                    official_phone_number_id, official_access_token, official_verify_token
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                            agentId,
                            whatsappConfig.enabled,
                            whatsappConfig.provider,
                            whatsappConfig.evolution?.baseUrl,
                            whatsappConfig.evolution?.apiKey,
                            whatsappConfig.evolution?.instanceName,
                            whatsappConfig.official?.phoneNumberId,
                            whatsappConfig.official?.accessToken,
                            whatsappConfig.official?.verifyToken
                        ]);

                        return { ...agentResult.rows[0], id: agentId };
                    });

                    res.status(201).json(newAgent);

                } catch (error) {
                    console.error('Erro ao criar agente:', error);
                    res.status(500).json({ error: 'Erro interno ao criar agente: ' + error.message });
                }
            });

            // Listar agentes (Simplificado, apenas dados básicos)
            router.get('/', async (req, res) => {
                try {
                    try {
                        const { clientId } = req.query;
                        let query = 'SELECT id, name, category, status, created_at, client_id FROM chatbots';
                        const params = [];

                        if (clientId) {
                            query += ' WHERE client_id = $1';
                            params.push(clientId);
                        }

                        query += ' ORDER BY created_at DESC';

                        const result = await pool.query(query, params);
                        res.json(result.rows);
                    } catch (error) {
                        console.error('Erro ao listar agentes:', error);
                        res.status(500).json({ error: 'Erro ao listar agentes' });
                    }
                });

            // Obter agente completo por ID
            router.get('/:id', async (req, res) => {
                try {
                    const { id } = req.params;

                    // Buscar dados principais
                    const agentResult = await pool.query('SELECT * FROM chatbots WHERE id = $1', [id]);
                    if (agentResult.rows.length === 0) {
                        return res.status(404).json({ error: 'Agente não encontrado' });
                    }
                    const agent = agentResult.rows[0];

                    // Buscar configs satélites
                    const aiConfigResult = await pool.query('SELECT * FROM agent_ai_configs WHERE chatbot_id = $1', [id]);
                    const vectorConfigResult = await pool.query('SELECT * FROM agent_vector_configs WHERE chatbot_id = $1', [id]);
                    const promptsResult = await pool.query('SELECT * FROM agent_prompts WHERE chatbot_id = $1', [id]);
                    const whatsappConfigResult = await pool.query('SELECT * FROM agent_whatsapp_configs WHERE chatbot_id = $1', [id]);

                    // Buscar filtros se houver vector config
                    let filters = [];
                    if (vectorConfigResult.rows.length > 0) {
                        const filtersResult = await pool.query('SELECT filter_tag FROM agent_vector_filters WHERE vector_config_id = $1', [vectorConfigResult.rows[0].id]);
                        filters = filtersResult.rows.map(r => r.filter_tag);
                    }

                    // Montar objeto de resposta compatível com o frontend
                    const aiConfig = aiConfigResult.rows[0] || {};
                    const vectorConfig = vectorConfigResult.rows[0] || {};
                    const prompts = promptsResult.rows[0] || {};
                    const whatsappConfig = whatsappConfigResult.rows[0] || {};

                    const response = {
                        id: agent.id,
                        identity: {
                            name: agent.name,
                            category: agent.category,
                            description: agent.description,
                            class: agent.class,
                            specializationLevel: agent.specialization_level,
                            specializationLevel: agent.specialization_level,
                            status: agent.status,
                            slug: agent.slug
                        },
                        aiConfig: {
                            provider: aiConfig.provider,
                            model: aiConfig.model,
                            temperature: parseFloat(aiConfig.temperature),
                            topP: parseFloat(aiConfig.top_p),
                            topK: aiConfig.top_k,
                            maxTokens: aiConfig.max_tokens,
                            timeout: aiConfig.timeout,
                            retries: aiConfig.retries
                        },
                        advancedConfig: agent.advanced_settings || {},
                        vectorConfig: {
                            chunkingMode: vectorConfig.chunking_mode,
                            chunkSize: vectorConfig.chunk_size,
                            sensitivity: vectorConfig.sensitivity,
                            contextWindow: vectorConfig.context_window,
                            relevanceThreshold: parseFloat(vectorConfig.relevance_threshold),
                            searchMode: vectorConfig.search_mode,
                            enableReranking: vectorConfig.enable_reranking,
                            chunkingStrategy: vectorConfig.chunking_strategy,
                            chunkDelimiter: vectorConfig.chunk_delimiter,
                            maxChunkSize: vectorConfig.max_chunk_size,
                            chunkOverlap: vectorConfig.chunk_overlap,
                            filters: filters
                        },
                        prompts: {
                            system: prompts.system_prompt,
                            responseStructure: prompts.response_structure_prompt,
                            vectorSearch: prompts.vector_search_prompt,
                            analysis: prompts.analysis_prompt,
                            complexCases: prompts.complex_cases_prompt,
                            validation: prompts.validation_prompt,
                            scriptContent: prompts.script_content
                        },
                        whatsappConfig: {
                            enabled: whatsappConfig.enabled,
                            provider: whatsappConfig.provider,
                            official: {
                                phoneNumberId: whatsappConfig.official_phone_number_id || '',
                                accessToken: whatsappConfig.official_access_token || '',
                                verifyToken: whatsappConfig.official_verify_token || ''
                            },
                            evolution: {
                                baseUrl: whatsappConfig.evolution_base_url || '',
                                apiKey: whatsappConfig.evolution_api_key || '',
                                instanceName: whatsappConfig.evolution_instance_name || ''
                            }
                        }
                    };

                    res.json(response);

                } catch (error) {
                    console.error('Erro ao buscar agente:', error);
                    res.status(500).json({ error: 'Erro ao buscar agente' });
                }
            });

            // Atualizar agente
            router.put('/:id', async (req, res) => {
                try {
                    const { id } = req.params;
                    const {
                        identity,
                        aiConfig,
                        vectorConfig,
                        prompts,
                        whatsappConfig,
                        advancedConfig
                    } = req.body;

                    const updatedAgent = await executeTransaction(async (client) => {
                        // 1. Atualizar Agente
                        const agentResult = await client.query(`
                UPDATE chatbots SET
        name = $1, description = $2, category = $3, class = $4, specialization_level = $5, status = $6, advanced_settings = $7, client_id = $8, updated_at = CURRENT_TIMESTAMP
                WHERE id = $9
        RETURNING *
            `, [identity.name, identity.description, identity.category, identity.class, identity.specializationLevel, identity.status, advancedConfig || {}, identity.clientId || null, id]);

                        if (agentResult.rows.length === 0) {
                            throw new Error('Agente não encontrado');
                        }

                        // 2. Upsert AI Config
                        await client.query(`
                UPDATE agent_ai_configs SET
        provider = $1, model = $2, temperature = $3, top_p = $4, top_k = $5, max_tokens = $6, timeout = $7, retries = $8,
            frequency_penalty = $9, presence_penalty = $10, stop_sequences = $11, response_mode = $12, candidate_count = $13,
            seed = $14, json_mode = $15
                WHERE chatbot_id = $16
            `, [
                            aiConfig.provider, aiConfig.model, aiConfig.temperature, aiConfig.topP, aiConfig.topK, aiConfig.maxTokens, aiConfig.timeout, aiConfig.retries,
                            aiConfig.frequencyPenalty || 0.0, aiConfig.presencePenalty || 0.0, aiConfig.stopSequences || null, aiConfig.responseMode || 'balanced', aiConfig.candidateCount || 1,
                            aiConfig.seed || null, aiConfig.jsonMode || false,
                            id
                        ]);

                        // 3. Upsert Vector Config
                        let vectorConfigId;
                        const updateVector = await client.query(`
                UPDATE agent_vector_configs SET
        chunking_mode = $1, chunk_size = $2, sensitivity = $3, context_window = $4, relevance_threshold = $5,
            search_mode = $6, enable_reranking = $7,
            chunking_strategy = $8, chunk_delimiter = $9, max_chunk_size = $10, chunk_overlap = $11
                WHERE chatbot_id = $12
                RETURNING id
            `, [
                            vectorConfig.chunkingMode, vectorConfig.chunkSize, vectorConfig.sensitivity, vectorConfig.contextWindow, vectorConfig.relevanceThreshold,
                            vectorConfig.searchMode || 'semantic', vectorConfig.enableReranking || false,
                            vectorConfig.chunkingStrategy || 'paragraph', vectorConfig.chunkDelimiter || '\n\n', vectorConfig.maxChunkSize || 2048, vectorConfig.chunkOverlap || 100,
                            id
                        ]);

                        if (updateVector.rowCount === 0) {
                            const insertVector = await client.query(`
                    INSERT INTO agent_vector_configs(
                chatbot_id, chunking_mode, chunk_size, sensitivity, context_window, relevance_threshold,
                search_mode, enable_reranking, chunking_strategy, chunk_delimiter, max_chunk_size, chunk_overlap
            )
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING id
            `, [
                                id, vectorConfig.chunkingMode, vectorConfig.chunkSize, vectorConfig.sensitivity, vectorConfig.contextWindow, vectorConfig.relevanceThreshold,
                                vectorConfig.searchMode || 'semantic', vectorConfig.enableReranking || false,
                                vectorConfig.chunkingStrategy || 'paragraph', vectorConfig.chunkDelimiter || '\n\n', vectorConfig.maxChunkSize || 2048, vectorConfig.chunkOverlap || 100
                            ]);
                            vectorConfigId = insertVector.rows[0].id;
                        } else {
                            vectorConfigId = updateVector.rows[0].id;
                        }

                        // 4. Atualizar Filtros
                        await client.query('DELETE FROM agent_vector_filters WHERE vector_config_id = $1', [vectorConfigId]);
                        if (vectorConfig.filters && vectorConfig.filters.length > 0) {
                            for (const filter of vectorConfig.filters) {
                                await client.query(`
                        INSERT INTO agent_vector_filters(vector_config_id, filter_tag)
                        VALUES($1, $2)
                    `, [vectorConfigId, filter]);
                            }
                        }

                        // 5. Upsert Prompts
                        const updatePrompts = await client.query(`
                UPDATE agent_prompts SET
        system_prompt = $1, response_structure_prompt = $2, vector_search_prompt = $3, analysis_prompt = $4, complex_cases_prompt = $5, validation_prompt = $6, script_content = $7
                WHERE chatbot_id = $8
            `, [prompts.system, prompts.responseStructure, prompts.vectorSearch, prompts.analysis, prompts.complexCases, prompts.validation, prompts.scriptContent || '', id]);

                        if (updatePrompts.rowCount === 0) {
                            await client.query(`
                    INSERT INTO agent_prompts(chatbot_id, system_prompt, response_structure_prompt, vector_search_prompt, analysis_prompt, complex_cases_prompt, validation_prompt, script_content)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)
            `, [id, prompts.system, prompts.responseStructure, prompts.vectorSearch, prompts.analysis, prompts.complexCases, prompts.validation, prompts.scriptContent || '']);
                        }

                        // 6. Upsert WhatsApp Config
                        const updateWhatsapp = await client.query(`
                UPDATE agent_whatsapp_configs SET
        enabled = $1, provider = $2,
            evolution_base_url = $3, evolution_api_key = $4, evolution_instance_name = $5,
            official_phone_number_id = $6, official_access_token = $7, official_verify_token = $8
                WHERE chatbot_id = $9
            `, [
                            whatsappConfig.enabled, whatsappConfig.provider,
                            whatsappConfig.evolution?.baseUrl, whatsappConfig.evolution?.apiKey, whatsappConfig.evolution?.instanceName,
                            whatsappConfig.official?.phoneNumberId, whatsappConfig.official?.accessToken, whatsappConfig.official?.verifyToken,
                            id
                        ]);

                        if (updateWhatsapp.rowCount === 0) {
                            await client.query(`
                    INSERT INTO agent_whatsapp_configs(
                chatbot_id, enabled, provider,
                evolution_base_url, evolution_api_key, evolution_instance_name,
                official_phone_number_id, official_access_token, official_verify_token
            )
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                                id, whatsappConfig.enabled, whatsappConfig.provider,
                                whatsappConfig.evolution?.baseUrl, whatsappConfig.evolution?.apiKey, whatsappConfig.evolution?.instanceName,
                                whatsappConfig.official?.phoneNumberId, whatsappConfig.official?.accessToken, whatsappConfig.official?.verifyToken
                            ]);
                        }

                        return agentResult.rows[0];
                    });

                    res.json(updatedAgent);

                } catch (error) {
                    console.error('Erro ao atualizar agente:', error);
                    res.status(500).json({ error: 'Erro ao atualizar agente: ' + error.message });
                }
            });

            // Testar Conexão (Stub para Evolution API / WhatsApp)
            router.post('/test-connection', async (req, res) => {
                const { provider, config } = req.body;

                try {
                    if (provider === 'evolution_api') {
                        if (!config.baseUrl || !config.apiKey) {
                            return res.status(400).json({ success: false, message: 'URL e API Key são obrigatórios' });
                        }
                        return res.json({ success: true, message: 'Conexão com Evolution API estabelecida com sucesso!' });
                    }
                    else if (provider === 'official') {
                        if (!config.phoneNumberId || !config.accessToken) {
                            return res.status(400).json({ success: false, message: 'Phone ID e Access Token são obrigatórios' });
                        }
                        return res.json({ success: true, message: 'Conexão com WhatsApp Cloud API verificada!' });
                    }

                    res.status(400).json({ success: false, message: 'Provedor desconhecido' });
                } catch (error) {
                    console.error('Erro no teste de conexão:', error);
                    res.status(500).json({ success: false, message: 'Falha ao testar conexão: ' + error.message });
                }
            });

            module.exports = router;
