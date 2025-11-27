const express = require('express');
const router = express.Router();
const pool = require('./database');
const agentTemplates = require('./config/agentTemplates');

// Listar todos os templates disponíveis
router.post('/setup-db', async (req, res) => {
    try {
        console.log('Iniciando setup de templates via API...');

        // 1. Criar Tabelas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS agent_templates (
                id SERIAL PRIMARY KEY,
                template_id VARCHAR(100) UNIQUE NOT NULL,
                template_name VARCHAR(255) NOT NULL,
                template_description TEXT,
                template_version VARCHAR(50) DEFAULT '1.0.0',
                category VARCHAR(100),
                base_config JSONB NOT NULL,
                default_parameters JSONB DEFAULT '[]'::jsonb,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS agent_parameter_groups (
                id SERIAL PRIMARY KEY,
                group_id VARCHAR(100) NOT NULL,
                group_label VARCHAR(255) NOT NULL,
                display_order INTEGER DEFAULT 0,
                chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS agent_custom_parameters (
                id SERIAL PRIMARY KEY,
                chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
                parameter_key VARCHAR(100) NOT NULL,
                parameter_value TEXT,
                parameter_type VARCHAR(50) DEFAULT 'text',
                category VARCHAR(100),
                display_label VARCHAR(255),
                display_order INTEGER DEFAULT 0,
                helper_text TEXT,
                is_required BOOLEAN DEFAULT false,
                is_visible BOOLEAN DEFAULT true,
                validation_rules JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(chatbot_id, parameter_key)
            );
        `);

        // 2. Popular Templates
        for (const key in agentTemplates) {
            const template = agentTemplates[key];
            const meta = template.meta;
            const baseConfig = template.baseConfig;
            const parameters = template.parameters;
            const groups = template.groups;

            // Inserir/Atualizar Template
            await pool.query(`
                INSERT INTO agent_templates (
                    template_id, template_name, template_description, 
                    template_version, category, base_config, default_parameters
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (template_id) 
                DO UPDATE SET 
                    template_name = EXCLUDED.template_name,
                    template_description = EXCLUDED.template_description,
                    base_config = EXCLUDED.base_config,
                    default_parameters = EXCLUDED.default_parameters,
                    updated_at = NOW()
            `, [
                meta.templateId,
                meta.templateName,
                meta.templateDescription,
                meta.version,
                meta.category,
                JSON.stringify(baseConfig),
                JSON.stringify(parameters)
            ]);

            // Atualizar Grupos
            if (groups && groups.length > 0) {
                const templatePrefix = `${meta.templateId}.%`;
                await pool.query('DELETE FROM agent_parameter_groups WHERE group_id LIKE $1', [templatePrefix]);

                for (const group of groups) {
                    const fullGroupId = `${meta.templateId}.${group.id}`;
                    await pool.query(`
                        INSERT INTO agent_parameter_groups (
                            group_id, group_label, display_order
                        )
                        VALUES ($1, $2, $3)
                    `, [fullGroupId, group.label, group.order]);
                }
            }
        }

        res.json({ success: true, message: 'Tabelas criadas e templates populados com sucesso!' });
    } catch (error) {
        console.error('Erro no setup de templates:', error);
        res.status(500).json({ error: 'Erro no setup: ' + error.message });
    }
});

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

// Criar novo template personalizado
router.post('/', async (req, res) => {
    try {
        const {
            template_id,
            template_name,
            template_description,
            category,
            base_config,
            default_parameters
        } = req.body;

        // Validação básica
        if (!template_id || !template_name || !base_config) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }

        const result = await pool.query(`
            INSERT INTO agent_templates (
                template_id, template_name, template_description, 
                category, base_config, default_parameters, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, true)
            RETURNING *
        `, [
            template_id,
            template_name,
            template_description || '',
            category || 'custom',
            base_config,
            JSON.stringify(default_parameters || [])
        ]);

        res.status(201).json({
            message: 'Template criado com sucesso',
            template: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar template:', error);
        res.status(500).json({ error: 'Erro ao criar template: ' + error.message });
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

// Deletar um template
router.delete('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;

        // Soft delete (apenas marca como inativo)
        const result = await pool.query(`
            UPDATE agent_templates
            SET is_active = false
            WHERE template_id = $1
            RETURNING *
        `, [templateId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        res.json({ message: 'Template removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        res.status(500).json({ error: 'Erro ao deletar template' });
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
