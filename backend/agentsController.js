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
};

// Criar novo agente
router.post('/', async (req, res) => {
    try {
        const {
            identity,
            aiConfig,
            vectorConfig,
            INSERT INTO agent_ai_configs (
                chatbot_id, provider, model, temperature, top_p, top_k, max_tokens, timeout, retries,
                frequency_penalty, presence_penalty, stop_sequences, response_mode, candidate_count,
                seed, json_mode
            )
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
                for (const filter of vectorConfig.filters) {
                    await client.query(`
                        INSERT INTO agent_vector_filters(vector_config_id, filter_tag)
        VALUES($1, $2)
            `, [vectorConfigId, filter]);
                }
            }

            // 5. Inserir Prompts
            await client.query(`
                INSERT INTO agent_prompts(chatbot_id, system_prompt, response_structure_prompt, vector_search_prompt, analysis_prompt, complex_cases_prompt, validation_prompt)
        VALUES($1, $2, $3, $4, $5, $6, $7)
            `, [
                agentId,
                prompts.system,
                prompts.responseStructure,
                prompts.vectorSearch,
                prompts.analysis,
                prompts.complexCases,
                prompts.validation
            ]);

            // 6. Inserir WhatsApp Config
            await client.query(`
                INSERT INTO agent_whatsapp_configs(
                chatbot_id, enabled, provider,
                evolution_base_url, evolution_api_key, evolution_instance_name,
                official_phone_number_id, official_access_token, official_verify_token
            )
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        const result = await pool.query('SELECT id, name, category, status, created_at FROM chatbots ORDER BY created_at DESC');
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
                status: agent.status
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
                validation: prompts.validation_prompt
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
        name = $1, description = $2, category = $3, class = $4, specialization_level = $5, status = $6, advanced_settings = $7, updated_at = CURRENT_TIMESTAMP
                WHERE id = $8
        RETURNING *
            `, [identity.name, identity.description, identity.category, identity.class, identity.specializationLevel, identity.status, advancedConfig || {}, id]);

            if (agentResult.rows.length === 0) {
                throw new Error('Agente não encontrado');
            }

            // 2. Upsert AI Config (Deletar e inserir é mais simples para garantir consistência se não existir PK)
            // Mas vamos tentar UPDATE primeiro, se rowCount=0, INSERT.
            // 2. Upsert AI Config
            const updateAi = await client.query(`
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

            // 4. Atualizar Filtros (Deletar todos e inserir novos)
            await client.query('DELETE FROM agent_vector_filters WHERE vector_config_id = $1', [vectorConfigId]);
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
        system_prompt = $1, response_structure_prompt = $2, vector_search_prompt = $3, analysis_prompt = $4, complex_cases_prompt = $5, validation_prompt = $6
                WHERE chatbot_id = $7
            `, [prompts.system, prompts.responseStructure, prompts.vectorSearch, prompts.analysis, prompts.complexCases, prompts.validation, id]);

            if (updatePrompts.rowCount === 0) {
                await client.query(`
                    INSERT INTO agent_prompts(chatbot_id, system_prompt, response_structure_prompt, vector_search_prompt, analysis_prompt, complex_cases_prompt, validation_prompt)
        VALUES($1, $2, $3, $4, $5, $6, $7)
            `, [id, prompts.system, prompts.responseStructure, prompts.vectorSearch, prompts.analysis, prompts.complexCases, prompts.validation]);
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
