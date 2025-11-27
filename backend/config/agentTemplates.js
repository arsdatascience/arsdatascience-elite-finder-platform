/**
 * Templates de Agentes Pré-configurados
 * Define configurações base para diferentes tipos de agentes
 */

const agentTemplates = {
    // ==========================================
    // TEMPLATE 1: VENDEDOR
    // ==========================================
    sales_agent: {
        meta: {
            templateId: 'sales_agent',
            templateName: 'Agente de Vendas',
            templateDescription: 'Agente especializado em vendas com estratégias personalizáveis',
            version: '1.0.0',
            category: 'sales'
        },
        baseConfig: {
            identity: {
                name: 'Agente de Vendas',
                category: 'sales',
                class: 'specialist',
                specializationLevel: 3,
                status: 'active'
            },
            aiConfig: {
                provider: 'gemini',
                model: 'gemini-2.0-flash-exp',
                temperature: 0.7,
                topP: 0.9,
                topK: 40,
                maxTokens: 2048,
                timeout: 30000,
                retries: 3,
                frequencyPenalty: 0.3,
                presencePenalty: 0.2,
                responseMode: 'balanced'
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'semantic',
                chunkSize: 512,
                sensitivity: 'balanced',
                contextWindow: 3,
                relevanceThreshold: 0.75,
                chunkingStrategy: 'semantic',
                maxRetrievedChunks: 5,
                searchMode: 'hybrid'
            }
        },
        parameters: [
            {
                key: 'target_market',
                label: 'Mercado Alvo',
                type: 'text',
                category: 'sales_strategy',
                defaultValue: 'B2B - Empresas de médio porte',
                helperText: 'Descreva o perfil do cliente ideal',
                required: true,
                displayOrder: 1
            },
            {
                key: 'sales_strategy',
                label: 'Estratégia de Vendas',
                type: 'select',
                category: 'sales_strategy',
                defaultValue: 'consultative',
                options: [
                    { value: 'consultative', label: 'Consultiva' },
                    { value: 'solution', label: 'Solução' },
                    { value: 'transactional', label: 'Transacional' },
                    { value: 'relationship', label: 'Relacionamento' }
                ],
                required: true,
                displayOrder: 2
            },
            {
                key: 'opening_approach',
                label: 'Abordagem Inicial',
                type: 'textarea',
                category: 'communication',
                defaultValue: 'Olá! Obrigado pelo contato. Sou especialista em soluções para [seu segmento]. Como posso ajudá-lo hoje?',
                helperText: 'Mensagem de abertura padrão do agente',
                required: true,
                displayOrder: 3
            },
            {
                key: 'objection_handling_price',
                label: 'Tratamento de Objeção: Preço',
                type: 'textarea',
                category: 'objection_handling',
                defaultValue: 'Entendo sua preocupação com o investimento. Vamos conversar sobre o ROI e como nossa solução pode gerar valor para seu negócio.',
                displayOrder: 4
            },
            {
                key: 'objection_handling_competition',
                label: 'Tratamento de Objeção: Concorrência',
                type: 'textarea',
                category: 'objection_handling',
                defaultValue: 'Ótimo que está pesquisando! Nossos diferenciais são X, Y e Z. Gostaria de entender melhor suas necessidades?',
                displayOrder: 5
            },
            {
                key: 'objection_handling_timing',
                label: 'Tratamento de Objeção: Timing',
                type: 'textarea',
                category: 'objection_handling',
                defaultValue: 'Compreendo. Quando seria um bom momento para retomarmos? Posso enviar material para análise?',
                displayOrder: 6
            },
            {
                key: 'qualification_questions',
                label: 'Perguntas de Qualificação',
                type: 'textarea',
                category: 'sales_process',
                defaultValue: '1. Qual o principal desafio que está enfrentando?\n2. Qual o prazo para implementação?\n3. Quem mais está envolvido na decisão?',
                displayOrder: 7
            }
        ],
        groups: [
            { id: 'sales_strategy', label: 'Estratégia de Vendas', order: 1 },
            { id: 'communication', label: 'Comunicação', order: 2 },
            { id: 'objection_handling', label: 'Tratamento de Objeções', order: 3 },
            { id: 'sales_process', label: 'Processo de Vendas', order: 4 }
        ]
    },

    // ==========================================
    // TEMPLATE 2: SAC (Serviço de Atendimento ao Cliente)
    // ==========================================
    customer_service: {
        meta: {
            templateId: 'customer_service',
            templateName: 'SAC - Atendimento ao Cliente',
            templateDescription: 'Suporte 24/7 com políticas de atendimento personalizáveis',
            version: '1.0.0',
            category: 'support'
        },
        baseConfig: {
            identity: {
                name: 'Assistente SAC',
                category: 'support',
                class: 'generalist',
                specializationLevel: 2,
                status: 'active'
            },
            aiConfig: {
                provider: 'gemini',
                model: 'gemini-2.0-flash-exp',
                temperature: 0.5,
                topP: 0.85,
                topK: 30,
                maxTokens: 1536,
                timeout: 25000,
                retries: 3,
                frequencyPenalty: 0.2,
                presencePenalty: 0.1,
                responseMode: 'concise'
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'adaptive',
                chunkSize: 384,
                sensitivity: 'high',
                contextWindow: 5,
                relevanceThreshold: 0.80,
                chunkingStrategy: 'adaptive',
                maxRetrievedChunks: 7,
                searchMode: 'semantic'
            }
        },
        parameters: [
            {
                key: 'support_availability',
                label: 'Disponibilidade de Suporte',
                type: 'select',
                category: 'service_config',
                defaultValue: '24_7',
                options: [
                    { value: '24_7', label: '24/7 - Sempre disponível' },
                    { value: 'business_hours', label: 'Horário comercial' },
                    { value: 'extended', label: 'Horário estendido (8h-22h)' }
                ],
                required: true,
                displayOrder: 1
            },
            {
                key: 'greeting_message',
                label: 'Mensagem de Boas-Vindas',
                type: 'textarea',
                category: 'communication',
                defaultValue: 'Olá! Bem-vindo ao nosso SAC. Estou aqui para ajudá-lo. Como posso auxiliar hoje?',
                required: true,
                displayOrder: 2
            },
            {
                key: 'service_policy',
                label: 'Política de Atendimento',
                type: 'textarea',
                category: 'policies',
                defaultValue: 'Nosso compromisso é resolver sua solicitação no primeiro contato sempre que possível.',
                displayOrder: 3
            },
            {
                key: 'escalation_threshold',
                label: 'Critério de Escalação',
                type: 'select',
                category: 'escalation',
                defaultValue: 'complex',
                options: [
                    { value: 'immediate', label: 'Imediata - Para qualquer questão complexa' },
                    { value: 'complex', label: 'Problemas complexos ou recorrentes' },
                    { value: 'critical', label: 'Apenas casos críticos' }
                ],
                displayOrder: 4
            },
            {
                key: 'escalation_message',
                label: 'Mensagem de Escalação',
                type: 'textarea',
                category: 'escalation',
                defaultValue: 'Vou transferir você para um especialista que poderá ajudá-lo melhor com essa questão.',
                displayOrder: 5
            },
            {
                key: 'refund_policy',
                label: 'Política de Reembolso',
                type: 'textarea',
                category: 'policies',
                defaultValue: 'Reembolsos são processados em até 7 dias úteis após aprovação.',
                displayOrder: 6
            },
            {
                key: 'max_response_time',
                label: 'Tempo Máximo de Resposta (segundos)',
                type: 'number',
                category: 'service_config',
                defaultValue: '30',
                validation: { min: 5, max: 120 },
                displayOrder: 7
            }
        ],
        groups: [
            { id: 'service_config', label: 'Configurações de Serviço', order: 1 },
            { id: 'communication', label: 'Comunicação', order: 2 },
            { id: 'policies', label: 'Políticas', order: 3 },
            { id: 'escalation', label: 'Escalação', order: 4 }
        ]
    },

    // ==========================================
    // TEMPLATE 3: SUPORTE TÉCNICO
    // ==========================================
    technical_support: {
        meta: {
            templateId: 'technical_support',
            templateName: 'Suporte Técnico',
            templateDescription: 'Suporte técnico multi-nível com base de conhecimento',
            version: '1.0.0',
            category: 'technical'
        },
        baseConfig: {
            identity: {
                name: 'Assistente Técnico',
                category: 'technical_support',
                class: 'specialist',
                specializationLevel: 4,
                status: 'active'
            },
            aiConfig: {
                provider: 'gemini',
                model: 'gemini-2.0-flash-exp',
                temperature: 0.3,
                topP: 0.8,
                topK: 20,
                maxTokens: 2048,
                timeout: 35000,
                retries: 3,
                frequencyPenalty: 0.1,
                presencePenalty: 0.1,
                responseMode: 'detailed'
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'recursive',
                chunkSize: 768,
                sensitivity: 'very_high',
                contextWindow: 7,
                relevanceThreshold: 0.85,
                chunkingStrategy: 'recursive',
                maxRetrievedChunks: 10,
                searchMode: 'hybrid',
                enableReranking: true
            }
        },
        parameters: [
            {
                key: 'support_tier',
                label: 'Nível de Suporte',
                type: 'select',
                category: 'support_config',
                defaultValue: 'tier_1',
                options: [
                    { value: 'tier_1', label: 'Tier 1 - Suporte Básico' },
                    { value: 'tier_2', label: 'Tier 2 - Suporte Intermediário' },
                    { value: 'tier_3', label: 'Tier 3 - Suporte Avançado' }
                ],
                required: true,
                displayOrder: 1
            },
            {
                key: 'tech_stack',
                label: 'Stack Tecnológico',
                type: 'textarea',
                category: 'knowledge',
                defaultValue: 'JavaScript, React, Node.js, PostgreSQL, AWS',
                helperText: 'Tecnologias que o agente domina',
                required: true,
                displayOrder: 2
            },
            {
                key: 'knowledge_base_url',
                label: 'URL da Base de Conhecimento',
                type: 'text',
                category: 'knowledge',
                defaultValue: 'https://docs.exemplo.com',
                displayOrder: 3
            },
            {
                key: 'diagnostic_tools',
                label: 'Ferramentas de Diagnóstico',
                type: 'textarea',
                category: 'tools',
                defaultValue: 'Logs, Health Check, Network Analyzer',
                helperText: 'Ferramentas disponíveis para diagnóstico',
                displayOrder: 4
            },
            {
                key: 'common_issues',
                label: 'Problemas Comuns',
                type: 'textarea',
                category: 'knowledge',
                defaultValue: '1. Erro de conexão\n2. Timeout de API\n3. Falha de autenticação',
                displayOrder: 5
            },
            {
                key: 'escalation_to_engineer',
                label: 'Critérios para Escalar a Engenharia',
                type: 'textarea',
                category: 'escalation',
                defaultValue: 'Bugs críticos, problemas de arquitetura, falhas de sistema',
                displayOrder: 6
            },
            {
                key: 'response_format',
                label: 'Formato de Resposta',
                type: 'select',
                category: 'support_config',
                defaultValue: 'step_by_step',
                options: [
                    { value: 'step_by_step', label: 'Passo a passo detalhado' },
                    { value: 'quick_fix', label: 'Solução rápida' },
                    { value: 'diagnostic_first', label: 'Diagnóstico primeiro' }
                ],
                displayOrder: 7
            }
        ],
        groups: [
            { id: 'support_config', label: 'Configurações de Suporte', order: 1 },
            { id: 'knowledge', label: 'Base de Conhecimento', order: 2 },
            { id: 'tools', label: 'Ferramentas', order: 3 },
            { id: 'escalation', label: 'Escalação', order: 4 }
        ]
    },

    // ==========================================
    // TEMPLATE 4: CRM
    // ==========================================
    crm_agent: {
        meta: {
            templateId: 'crm_agent',
            templateName: 'Agente CRM',
            templateDescription: 'Gerenciamento de leads e oportunidades com automação',
            version: '1.0.0',
            category: 'automation'
        },
        baseConfig: {
            identity: {
                name: 'Assistente CRM',
                category: 'crm',
                class: 'generalist',
                specializationLevel: 3,
                status: 'active'
            },
            aiConfig: {
                provider: 'gemini',
                model: 'gemini-2.0-flash-exp',
                temperature: 0.6,
                topP: 0.9,
                topK: 35,
                maxTokens: 1792,
                timeout: 30000,
                retries: 3,
                frequencyPenalty: 0.2,
                presencePenalty: 0.2,
                responseMode: 'balanced'
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'semantic',
                chunkSize: 512,
                sensitivity: 'balanced',
                contextWindow: 4,
                relevanceThreshold: 0.75,
                chunkingStrategy: 'semantic',
                maxRetrievedChunks: 6,
                searchMode: 'hybrid'
            }
        },
        parameters: [
            {
                key: 'lead_scoring_criteria',
                label: 'Critérios de Pontuação de Leads',
                type: 'textarea',
                category: 'lead_management',
                defaultValue: 'Budget: 30pts, Authority: 25pts, Need: 25pts, Timeline: 20pts',
                helperText: 'Sistema de pontuação BANT',
                required: true,
                displayOrder: 1
            },
            {
                key: 'lead_qualification',
                label: 'Perguntas de Qualificação',
                type: 'textarea',
                category: 'lead_management',
                defaultValue: '1. Qual seu orçamento?\n2. Você é o decisor?\n3. Qual a urgência?',
                displayOrder: 2
            },
            {
                key: 'opportunity_stages',
                label: 'Estágios da Oportunidade',
                type: 'textarea',
                category: 'pipeline',
                defaultValue: 'Prospecção → Qualificação → Proposta → Negociação → Fechamento',
                required: true,
                displayOrder: 3
            },
            {
                key: 'auto_follow_up',
                label: 'Follow-up Automático',
                type: 'select',
                category: 'automation',
                defaultValue: 'enabled',
                options: [
                    { value: 'enabled', label: 'Habilitado' },
                    { value: 'disabled', label: 'Desabilitado' },
                    { value: 'scheduled', label: 'Apenas agendado' }
                ],
                displayOrder: 4
            },
            {
                key: 'follow_up_interval',
                label: 'Intervalo de Follow-up (horas)',
                type: 'number',
                category: 'automation',
                defaultValue: '48',
                validation: { min: 24, max: 168 },
                displayOrder: 5
            },
            {
                key: 'workflow_triggers',
                label: 'Gatilhos de Workflow',
                type: 'textarea',
                category: 'automation',
                defaultValue: 'Lead qualificado, Proposta enviada, Sem resposta por 3 dias',
                helperText: 'Eventos que acionam ações automáticas',
                displayOrder: 6
            },
            {
                key: 'data_analysis_metrics',
                label: 'Métricas de Análise',
                type: 'textarea',
                category: 'analytics',
                defaultValue: 'Taxa de conversão, Tempo médio de fechamento, Valor médio do negócio',
                displayOrder: 7
            },
            {
                key: 'integration_crm',
                label: 'CRM Integrado',
                type: 'select',
                category: 'integrations',
                defaultValue: 'native',
                options: [
                    { value: 'native', label: 'CRM Nativo' },
                    { value: 'salesforce', label: 'Salesforce' },
                    { value: 'hubspot', label: 'HubSpot' },
                    { value: 'pipedrive', label: 'Pipedrive' }
                ],
                displayOrder: 8
            }
        ],
        groups: [
            { id: 'lead_management', label: 'Gerenciamento de Leads', order: 1 },
            { id: 'pipeline', label: 'Pipeline de Vendas', order: 2 },
            { id: 'automation', label: 'Automação', order: 3 },
            { id: 'analytics', label: 'Análise de Dados', order: 4 },
            { id: 'integrations', label: 'Integrações', order: 5 }
        ]
    },

    // ==========================================
    // TEMPLATE 5: WHATSAPP SALES & ANALYTICS
    // ==========================================
    whatsapp_analytics: {
        meta: {
            templateId: 'whatsapp_analytics',
            templateName: 'WhatsApp Sales & Analytics',
            templateDescription: 'Agente de WhatsApp com inteligência de análise de conversas e estratégia de vendas em tempo real.',
            version: '1.0.0',
            category: 'whatsapp'
        },
        baseConfig: {
            identity: {
                name: 'WhatsApp Strategist',
                category: 'sales',
                class: 'SalesAgent',
                specializationLevel: 5,
                status: 'active'
            },
            aiConfig: {
                provider: 'openai',
                model: 'gpt-4-turbo-preview',
                temperature: 0.7,
                maxTokens: 1000,
                responseMode: 'balanced'
            },
            whatsappConfig: {
                enabled: true,
                provider: 'evolution_api'
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'semantic',
                chunkSize: 512,
                sensitivity: 'balanced',
                contextWindow: 5
            }
        },
        parameters: [
            {
                key: 'evolution_instance',
                label: 'Nome da Instância (Evolution API)',
                type: 'text',
                category: 'whatsapp_config',
                defaultValue: 'minha_instancia',
                required: true,
                displayOrder: 1
            },
            {
                key: 'evolution_apikey',
                label: 'API Key (Evolution API)',
                type: 'password',
                category: 'whatsapp_config',
                required: true,
                displayOrder: 2
            },
            {
                key: 'auto_analysis',
                label: 'Análise Automática de Conversa',
                type: 'boolean',
                category: 'analytics',
                defaultValue: 'true',
                helperText: 'Gerar insights estratégicos após cada interação significativa',
                displayOrder: 3
            },
            {
                key: 'sales_script',
                label: 'Script de Vendas Base',
                type: 'textarea',
                category: 'strategy',
                defaultValue: '1. Saudação\n2. Qualificação\n3. Apresentação\n4. Fechamento',
                displayOrder: 4
            }
        ],
        groups: [
            { id: 'whatsapp_config', label: 'Configuração WhatsApp', order: 1 },
            { id: 'analytics', label: 'Inteligência & Análise', order: 2 },
            { id: 'strategy', label: 'Estratégia de Vendas', order: 3 }
        ]
    }
};

module.exports = agentTemplates;
