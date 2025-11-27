const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Listar todos os templates disponíveis
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, template_id, template_name, template_description,
                template_version, category, is_active, created_at
            FROM agent_templates
            WHERE is_active = true
            ORDER BY category, template_name
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar templates:', error);
        res.status(500).json({ error: 'Erro ao listar templates' });
    }
});

// Obter detalhes completos de um template
router.get('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;

        const result = await pool.query(`
            SELECT *
            FROM agent_templates
            WHERE template_id = $1 AND is_active = true
        `, [templateId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        const template = result.rows[0];

        // Buscar grupos de parâmetros associados
        const groupsResult = await pool.query(`
            SELECT group_id, group_label, display_order
            FROM agent_parameter_groups
            WHERE chatbot_id IS NULL
            AND group_id LIKE $1
            ORDER BY display_order
        `, [`${templateId}.%`]);

        res.json({
            ...template,
            groups: groupsResult.rows
        });
    } catch (error) {
        console.error('Erro ao buscar template:', error);
        res.status(500).json({ error: 'Erro ao buscar template' });
    }
});

// Criar agente a partir de um template
router.post('/:templateId/instantiate', async (req, res) => {
    try {
        const { templateId } = req.params;
        const { customizations } = req.body;

        // Buscar template
        const templateResult = await pool.query(`
            SELECT base_config, default_parameters
            FROM agent_templates
            WHERE template_id = $1 AND is_active = true
        `, [templateId]);

        if (templateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        const template = templateResult.rows[0];
        const baseConfig = template.base_config;
        const defaultParameters = template.default_parameters;

        // Mesclar customizações com configuração base
        const finalConfig = {
            ...baseConfig,
            identity: {
                ...baseConfig.identity,
                ...(customizations?.identity || {})
            },
            aiConfig: {
                ...baseConfig.aiConfig,
                ...(customizations?.aiConfig || {})
            },
            vectorConfig: {
                ...baseConfig.vectorConfig,
                ...(customizations?.vectorConfig || {})
            }
        };

        // Criar agente usando a rota de criação padrão (reaproveitando lógica)
        const agentResponse = await fetch(`${req.protocol}://${req.get('host')}/api/agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalConfig)
        });

        const newAgent = await agentResponse.json();

        // Aplicar parâmetros customizados
        if (customizations?.parameters) {
            for (const [key, value] of Object.entries(customizations.parameters)) {
                const param = defaultParameters.find(p => p.key === key);
                if (param) {
                    await pool.query(`
                        INSERT INTO agent_custom_parameters (
                            chatbot_id, parameter_key, parameter_value, parameter_type,
                            category, display_label, helper_text, is_required
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (chatbot_id, parameter_key) 
                        DO UPDATE SET parameter_value = EXCLUDED.parameter_value
                    `, [
                        newAgent.id,
                        key,
                        value,
                        param.type,
                        param.category,
                        param.label,
                        param.helperText || '',
                        param.required || false
                    ]);
                }
            }
        } else {
            // Aplicar parâmetros padrão
            for (const param of defaultParameters) {
                await pool.query(`
                    INSERT INTO agent_custom_parameters (
                        chatbot_id, parameter_key, parameter_value, parameter_type,
                        category, display_label, helper_text, is_required
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    newAgent.id,
                    param.key,
                    param.defaultValue || '',
                    param.type,
                    param.category,
                    param.label,
                    param.helperText || '',
                    param.required || false
                ]);
            }
        }

        res.status(201).json({
            message: 'Agente criado a partir do template com sucesso',
            agent: newAgent,
            templateId
        });

    } catch (error) {
        console.error('Erro ao instanciar template:', error);
        res.status(500).json({ error: 'Erro ao criar agente: ' + error.message });
    }
});

// Obter parâmetros customizados de um agente
router.get('/agents/:agentId/parameters', async (req, res) => {
    try {
        const { agentId } = req.params;

        const result = await pool.query(`
            SELECT 
                parameter_key, parameter_value, parameter_type,
                category, display_label, display_order, helper_text,
                is_required, is_visible, validation_rules
            FROM agent_custom_parameters
            WHERE chatbot_id = $1
            ORDER BY category, display_order
        `, [agentId]);

        // Agrupar por categoria
        const grouped = result.rows.reduce((acc, param) => {
            const category = param.category || 'general';
            if (!acc[category]) acc[category] = [];
            acc[category].push(param);
            return acc;
        }, {});

        res.json({
            agentId: parseInt(agentId),
            parameters: grouped,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Erro ao buscar parâmetros:', error);
        res.status(500).json({ error: 'Erro ao buscar parâmetros' });
    }
});

// Atualizar parâmetro customizado de um agente
router.put('/agents/:agentId/parameters/:paramKey', async (req, res) => {
    try {
        const { agentId, paramKey } = req.params;
        const { value } = req.body;

        const result = await pool.query(`
            UPDATE agent_custom_parameters
            SET parameter_value = $1, updated_at = NOW()
            WHERE chatbot_id = $2 AND parameter_key = $3
            RETURNING *
        `, [value, agentId, paramKey]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Parâmetro não encontrado' });
        }

        res.json({
            message: 'Parâmetro atualizado com sucesso',
            parameter: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar parâmetro:', error);
        res.status(500).json({ error: 'Erro ao atualizar parâmetro' });
    }
});

module.exports = router;
