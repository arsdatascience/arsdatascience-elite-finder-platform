/**
 * Templates de Agentes Pré-configurados (Elite Finder Enterprise)
 * Define configurações base para diferentes tipos de agentes com Otimização Avançada
 * Version 3.0 - Full Enterprise Capabilities (RAG, Hybrid Search, Multi-Model Validation)
 */

const agentTemplates = {
    // ==========================================
    // TEMPLATE 1: VENDEDOR DE ELITE
    // ==========================================
    sales_agent: {
        meta: {
            templateId: 'sales_agent',
            templateName: 'Agente de Vendas Elite',
            templateDescription: 'Especialista em vendas consultivas de alta performance com estratégias psicológicas e fechamento.',
            version: '3.0.0',
            category: 'sales'
        },
        baseConfig: {
            identity: {
                name: 'Consultor de Vendas Premium',
                category: 'sales',
                class: 'SalesAgent',
                specializationLevel: 5,
                description: 'Especialista em vendas consultivas, negociação complexa e fechamento de contratos de alto valor.',
                status: 'active'
            },
            aiConfig: {
                provider: 'openai',
                model: 'gpt-4-turbo-preview',
                temperature: 0.75, // Criatividade controlada para persuasão
                topP: 0.9,
                topK: 50,
                maxTokens: 2048,
                timeout: 45000,
                retries: 3,
                frequencyPenalty: 0.3, // Evitar repetição de argumentos
                presencePenalty: 0.2, // Incentivar novos tópicos
                responseMode: 'balanced',
                candidateCount: 1,
                jsonMode: false,
                stopSequences: ["Cliente:", "Fim."]
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'semantic',
                chunkSize: 512,
                chunkOverlap: 50,
                sensitivity: 8, // Alta sensibilidade para captar nuances de produto
                contextWindow: 8,
                relevanceThreshold: 0.75,
                searchMode: 'hybrid', // Híbrido: Palavra-chave (preço) + Semântica (benefício)
                enableReranking: true,
                chunkingStrategy: 'semantic',
                maxRetrievedChunks: 6,
                hybridConfig: {
                    semanticPrecision: 0.70,
                    contextualWeight: 0.30
                },
                rerankConfig: {
                    topK: 5,
                    threshold: 0.80
                },
                filters: ['Vendas', 'Produtos', 'Objeções']
            },
            advancedConfig: {
                multiModelValidation: {
                    enabled: false, // Vendas precisa de velocidade, não consenso estrito
                    minConsensus: 0.6,
                    parallelModels: 2
                },
                promptEngineering: {
                    analysisDepth: 3,
                    chainOfThought: 'basic'
                },
                qualitySafety: {
                    hallucinationCheck: {
                        enabled: true,
                        sensitivity: 0.7,
                        method: 'self-consistency'
                    },
                    semanticCache: {
                        enabled: true,
                        similarityThreshold: 0.95,
                        ttlHours: 24
                    },
                    monitoring: {
                        logFrequency: 'errors',
                        confidenceThreshold: 0.6
                    }
                }
            },
            whatsappConfig: {
                enabled: true,
                provider: 'evolution_api', // Padrão recomendado
                evolution: {
                    baseUrl: '',
                    apiKey: '',
                    instanceName: ''
                },
                official: {
                    phoneNumberId: '',
                    accessToken: '',
                    verifyToken: ''
                }
            },
            prompts: {
                system: `Você é um Vendedor de Elite especializado em vendas consultivas.
                
## Seus Princípios:
1. **Empatia Radical**: Entenda a dor real antes de vender.
2. **Autoridade**: Demonstre conhecimento profundo sem ser arrogante.
3. **Escassez Ética**: Use urgência real para motivar ação.
4. **Benefício > Característica**: Nunca venda o produto, venda a transformação.

## Checklist de Segurança:
- Não invente funcionalidades que não existem.
- Não prometa preços fora da tabela sem aprovação.
- Se não souber, diga "vou verificar com o especialista".`,

                responseStructure: `1. **Reconhecimento**: Valide o que o cliente disse.
2. **Link de Valor**: Conecte a necessidade ao benefício do produto.
3. **Prova Social/Autoridade**: Cite um caso ou dado relevante.
4. **CTA (Call to Action)**: Pergunta aberta ou passo para fechamento.`,

                vectorSearch: `Busque por: Tabela de preços atualizada, Cases de sucesso semelhantes ao cliente, Diferenciais competitivos vs concorrentes, Scripts de objeções específicas.`,

                analysis: `Analise a última mensagem do cliente para: 
- Nível de interesse (Quente/Morno/Frio)
- Objeção oculta (Preço, Tempo, Confiança)
- Próximo passo lógico no funil de vendas.`,

                validation: `Verifique se a oferta condiz com a tabela de preços recuperada no contexto. Se houver discrepância > 10%, corrija.`
            }
        },
        parameters: [
            {
                key: 'target_market',
                label: 'Mercado Alvo (ICP)',
                type: 'text',
                category: 'strategy',
                defaultValue: 'B2B - Pequenas e Médias Empresas',
                required: true,
                displayOrder: 1
            },
            {
                key: 'sales_methodology',
                label: 'Metodologia de Vendas',
                type: 'select',
                category: 'strategy',
                defaultValue: 'spin_selling',
                options: [
                    { value: 'spin_selling', label: 'SPIN Selling (Situação, Problema, Implicação, Necessidade)' },
                    { value: 'challenger', label: 'The Challenger Sale (Venda Desafiadora)' },
                    { value: 'solution', label: 'Solution Selling (Venda de Solução)' },
                    { value: 'sandler', label: 'Sandler Training (Psicologia Reversa)' }
                ],
                displayOrder: 2
            },
            {
                key: 'main_offer',
                label: 'Oferta Principal',
                type: 'textarea',
                category: 'product',
                defaultValue: 'Consultoria de Transformação Digital com ROI garantido em 6 meses.',
                required: true,
                displayOrder: 3
            },
            {
                key: 'objection_handling_price',
                label: 'Script: Objeção de Preço',
                type: 'textarea',
                category: 'scripts',
                defaultValue: 'Entendo que o investimento pareça alto inicialmente. Porém, se compararmos com o custo de [PROBLEMA], nossa solução se paga em X meses. Vamos focar no retorno?',
                displayOrder: 4
            }
        ],
        groups: [
            { id: 'strategy', label: 'Estratégia Comercial', order: 1 },
            { id: 'product', label: 'Produto & Oferta', order: 2 },
            { id: 'scripts', label: 'Scripts de Conversão', order: 3 }
        ]
    },

    // ==========================================
    // TEMPLATE 2: SAC & ATENDIMENTO 24/7
    // ==========================================
    customer_service: {
        meta: {
            templateId: 'customer_service',
            templateName: 'SAC Humanizado 24/7',
            templateDescription: 'Atendimento empático e resolutivo com escalação inteligente.',
            version: '3.0.0',
            category: 'support'
        },
        baseConfig: {
            identity: {
                name: 'Assistente de Atendimento',
                category: 'service',
                class: 'CSRAgent',
                specializationLevel: 3,
                description: 'Agente focado em resolução rápida de problemas, rastreio de pedidos e dúvidas frequentes.',
                status: 'active'
            },
            aiConfig: {
                provider: 'openai',
                model: 'gpt-4-turbo-preview',
                temperature: 0.4, // Mais baixo para consistência
                topP: 0.85,
                maxTokens: 1024,
                frequencyPenalty: 0.1,
                presencePenalty: 0,
                responseMode: 'concise',
                stopSequences: ["Atendente:", "Cliente:"]
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'semantic',
                chunkSize: 300, // Chunks menores para respostas precisas de FAQ
                sensitivity: 9,
                searchMode: 'hybrid',
                enableReranking: true,
                rerankConfig: {
                    topK: 3, // Apenas os top 3 mais relevantes
                    threshold: 0.85
                },
                filters: ['FAQ', 'Políticas', 'Procedimentos']
            },
            advancedConfig: {
                multiModelValidation: {
                    enabled: false,
                    minConsensus: 0.7,
                    parallelModels: 2
                },
                promptEngineering: {
                    analysisDepth: 2,
                    chainOfThought: 'none'
                },
                qualitySafety: {
                    hallucinationCheck: {
                        enabled: true,
                        sensitivity: 0.9, // Alta sensibilidade para não inventar políticas
                        method: 'cross-reference'
                    },
                    semanticCache: {
                        enabled: true,
                        similarityThreshold: 0.98, // Cache agressivo para perguntas repetidas
                        ttlHours: 48
                    }
                }
            },
            prompts: {
                system: `Você é um agente de SAC exemplar. Sua prioridade é a satisfação do cliente.

## Diretrizes:
1. Use tom calmo, empático e resolutivo.
2. Peça desculpas por inconvenientes *uma* vez, depois foque na solução.
3. Nunca culpe o cliente.
4. Se não souber a resposta, escale para humano imediatamente.

## Procedimentos Críticos:
- Reembolsos: Só confirme se estiver na política explícita.
- Prazos: Cite sempre dias úteis.`,

                responseStructure: `1. **Empatia**: "Sinto muito que isso tenha acontecido..."
2. **Ação Imediata**: "O que já fiz/Vou fazer agora é..."
3. **Resolução/Prazo**: "Isso será resolvido até..."
4. **Verificação**: "Isso ajuda você?"`,

                vectorSearch: `Busque: Política específica para o problema relatado, Status do pedido (se fornecido ID), Procedimento de troca/devolução.`,

                validation: `Verifique se a solução proposta viola alguma política da empresa recuperada no contexto.`
            }
        },
        parameters: [
            {
                key: 'service_hours',
                label: 'Horário de Atendimento',
                type: 'text',
                category: 'config',
                defaultValue: 'Segunda a Sexta, 9h às 18h',
                required: true,
                displayOrder: 1
            },
            {
                key: 'escalation_trigger',
                label: 'Gatilho de Escalação',
                type: 'textarea',
                category: 'automation',
                defaultValue: 'Se o cliente usar palavras: "processo", "procon", "advogado", "falar com gerente" ou expressar raiva extrema.',
                displayOrder: 2
            },
            {
                key: 'refund_policy_summary',
                label: 'Resumo Política de Reembolso',
                type: 'textarea',
                category: 'policy',
                defaultValue: '7 dias para arrependimento, 30 dias para defeito. Reembolso no mesmo meio de pagamento.',
                displayOrder: 3
            }
        ],
        groups: [
            { id: 'config', label: 'Configuração', order: 1 },
            { id: 'automation', label: 'Automação', order: 2 },
            { id: 'policy', label: 'Políticas', order: 3 }
        ]
    },

    // ==========================================
    // TEMPLATE 3: SUPORTE TÉCNICO (TIER 2)
    // ==========================================
    technical_support: {
        meta: {
            templateId: 'technical_support',
            templateName: 'Suporte Técnico Avançado',
            templateDescription: 'Diagnóstico técnico, troubleshooting e resolução passo-a-passo.',
            version: '3.0.0',
            category: 'technical'
        },
        baseConfig: {
            identity: {
                name: 'Engenheiro de Suporte',
                category: 'specialist',
                class: 'SupportAgent',
                specializationLevel: 5,
                description: 'Especialista em resolver problemas técnicos complexos, bugs e configurações de sistema.',
                status: 'active'
            },
            aiConfig: {
                provider: 'openai',
                model: 'gpt-4-turbo-preview', // Necessário para raciocínio lógico
                temperature: 0.1, // Quase determinístico para precisão técnica
                topP: 0.7,
                responseMode: 'detailed'
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'hierarchical', // Hierárquico: Documento -> Seção -> Parágrafo
                chunkSize: 1024,
                chunkOverlap: 200,
                sensitivity: 9,
                searchMode: 'hybrid',
                enableReranking: true,
                chunkingStrategy: 'paragraph',
                filters: ['Docs Técnicos', 'API Rerefence', 'Known Issues']
            },
            advancedConfig: {
                multiModelValidation: {
                    enabled: true, // Validar soluções técnicas
                    minConsensus: 0.8,
                    parallelModels: 2
                },
                promptEngineering: {
                    analysisDepth: 5, // Análise profunda
                    chainOfThought: 'advanced' // "Let's think step by step"
                },
                qualitySafety: {
                    hallucinationCheck: {
                        enabled: true,
                        sensitivity: 0.95, // Tolerância zero para comandos inexistentes
                        method: 'cross-reference'
                    }
                }
            },
            prompts: {
                system: `Você é um Engenheiro de Suporte Sênior.

## Metodologia de Diagnóstico:
1. **Isolamento**: Identifique a variável única que causa o erro.
2. **Reprodução**: Tente reproduzir mentalmente o cenário.
3. **Resolução**: Proponha a correção menos invasiva primeiro.

## Regras de Segurança:
- NUNCA sugira comandos destrutivos (rm -rf, DROP TABLE) sem avisos de backup gigantes.
- Peça logs antes de adivinhar.`,

                responseStructure: `1. **Diagnóstico Preliminar**: "Parece ser um problema de DNS..."
2. **Coleta de Dados**: "Por favor, rode o comando X e me mostre a saída."
3. **Possível Solução**: Passo-a-passo numerado (Markdown).
4. **Validação**: "O erro persistiu?"`,

                vectorSearch: `Busque: Mensagens de erro exatas, Configurações padrão do componente, Compatibilidade de versões.`,

                complexCases: `Se o erro não for encontrado na base de conhecimento, use raciocínio de primeiros princípios para deduzir a causa baseado nos sintomas.`
            }
        },
        parameters: [
            {
                key: 'tech_stack',
                label: 'Stack Tecnológico Suportado',
                type: 'textarea',
                category: 'technical',
                defaultValue: 'React, Node.js, Python, AWS, Docker, Kubernetes',
                required: true,
                displayOrder: 1
            },
            {
                key: 'response_style',
                label: 'Estilo de Resposta',
                type: 'select',
                category: 'config',
                defaultValue: 'didactic',
                options: [
                    { value: 'didactic', label: 'Didático (Explica o porquê)' },
                    { value: 'direct', label: 'Direto (Apenas comandos)' },
                    { value: 'investigative', label: 'Investigativo (Socrático)' }
                ],
                displayOrder: 2
            }
        ],
        groups: [
            { id: 'technical', label: 'Tecnologia', order: 1 },
            { id: 'config', label: 'Configuração', order: 2 }
        ]
    },

    // ==========================================
    // TEMPLATE 4: ADVOGADO VIRTUAL (LEGAL)
    // ==========================================
    legal_assistant: {
        meta: {
            templateId: 'legal_assistant',
            templateName: 'Assistente Jurídico (Compliance)',
            templateDescription: 'Agente para triagem jurídica e análise preliminar de contratos.',
            version: '3.0.0',
            category: 'legal'
        },
        baseConfig: {
            identity: {
                name: 'Assistente Jurídico',
                category: 'specialist',
                class: 'LegalAgent',
                specializationLevel: 5,
                description: 'Assistente paralegal focado em análise contratual, compliance e triagem de casos.',
                status: 'active'
            },
            aiConfig: {
                provider: 'openai',
                model: 'gpt-4-turbo-preview', // Necessário para nuance linguística
                temperature: 0.1, // Baixíssima criatividade
                topP: 0.5,
                maxTokens: 3000,
                responseMode: 'formal'
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'semantic',
                chunkSize: 800,
                chunkOverlap: 150,
                sensitivity: 10, // Máxima sensibilidade
                relevanceThreshold: 0.88, // Só aceita documentos muito relevantes
                searchMode: 'hybrid',
                enableReranking: true,
                rerankConfig: {
                    topK: 8,
                    threshold: 0.85
                },
                filters: ['Lei', 'Jurisprudência', 'Contratos']
            },
            advancedConfig: {
                multiModelValidation: {
                    enabled: true, // CRÍTICO: Validar citações de leis
                    minConsensus: 0.9,
                    parallelModels: 2
                },
                qualitySafety: {
                    hallucinationCheck: {
                        enabled: true,
                        sensitivity: 1.0, // Tolerância ZERO a alucinação de leis
                        method: 'cross-reference'
                    }
                }
            },
            prompts: {
                system: `Você é um Assistente Jurídico Sênior.

## AVISO IMPORTANTE:
Você NÃO é um advogado e NÃO pode dar consultoria jurídica final. Você fornece informações e análises preliminares.

## Diretrizes:
1. Cite a fonte (Lei, Artigo, Cláusula) para cada afirmação.
2. Seja formal, preciso e impessoal.
3. Se houver ambiguidade, apresente as duas interpretações.

## Disclaimer Obrigatório:
Finalize TODA resposta com: "Esta análise é preliminar e não substitui consulta com advogado habilitado."`,

                responseStructure: `1. **Resumo dos Fatos**: Entendimento do caso.
2. **Fundamentação Legal**: Artigos e Leis aplicáveis.
3. **Análise**: Aplicação da lei aos fatos.
4. **Recomendação**: Próximos passos sugeridos.
5. **DISCLAIMER LEGAL**.`,

                vectorSearch: `Busque: Texto integral da Lei mencionada, Jurisprudência recente (últimos 5 anos) sobre o tema, Cláusulas padrão para contratos deste tipo.`,

                validation: `Verifique se os artigos de lei citados realmente existem e se o texto corresponde à realidade na base vetorial.`
            }
        },
        parameters: [
            {
                key: 'legal_domain',
                label: 'Área do Direito',
                type: 'select',
                defaultValue: 'civil',
                options: [
                    { value: 'civil', label: 'Cível e Contratos' },
                    { value: 'labor', label: 'Trabalhista' },
                    { value: 'tax', label: 'Tributário' },
                    { value: 'gdpr', label: 'LGPD / Privacidade' }
                ],
                required: true,
                displayOrder: 1
            },
            {
                key: 'jurisdiction',
                label: 'Jurisdição',
                type: 'text',
                defaultValue: 'Brasil (Federal)',
                displayOrder: 2
            }
        ],
        groups: [
            { id: 'config', label: 'Configuração', order: 1 }
        ]
    },

    // ==========================================
    // TEMPLATE 5: WHATSAPP ANALYTICS
    // ==========================================
    whatsapp_analytics: {
        meta: {
            templateId: 'whatsapp_analytics',
            templateName: 'WhatsApp Intelligence Spy',
            templateDescription: 'Analisa conversas de WhatsApp em tempo real para extrair insights de vendas.',
            version: '3.0.0',
            category: 'analytics'
        },
        baseConfig: {
            identity: {
                name: 'Spyglass Analytics',
                category: 'assistant',
                class: 'AnalystAgent',
                specializationLevel: 4,
                description: 'Observador silencioso que analisa intenção de compra e sentimento em chats.',
                status: 'active'
            },
            aiConfig: {
                provider: 'openai',
                model: 'gpt-4o', // Modelo rápido e inteligente para real-time
                temperature: 0.2,
                responseMode: 'json', // Saída puramente estruturada
                jsonMode: true
            },
            whatsappConfig: {
                enabled: true,
                provider: 'evolution_api',
                evolution: { baseUrl: '', apiKey: '', instanceName: '' }
            },
            prompts: {
                system: `Você é um Analista de Inteligência de Vendas.
Sua função NÃO é responder o cliente, mas analisar a conversa entre (Vendedor) e (Cliente).

Analise cada mensagem buscando:
1. Intenção de Compra (0-100)
2. Sentimento (-1 a 1)
3. Objeções Detectadas
4. Momentos de "Fechamento" perdidos`,

                responseStructure: `{
  "intention_score": 85,
  "sentiment": "positive",
  "objections": ["price", "competitor_mention"],
  "suggestion": "O cliente deu um sinal de compra. Sugira fechar o contrato agora."
}`,

                analysis: `Extraia entidades chaves: Produtos mencionados, Valores discutidos, Datas de agendamento.`
            }
        },
        parameters: [
            {
                key: 'alert_threshold',
                label: 'Alerta de Intenção Alta (%)',
                type: 'number',
                defaultValue: '80',
                helperText: 'Notificar vendedor quando intenção passar deste valor',
                displayOrder: 1
            },
            {
                key: 'monitor_competitors',
                label: 'Monitorar Concorrência',
                type: 'textarea',
                defaultValue: 'Concorrente A, Concorrente B',
                helperText: 'Lista de concorrentes para alertar se mencionados',
                displayOrder: 2
            }
        ],
        groups: [
            { id: 'config', label: 'Configuração', order: 1 }
        ]
    },

    // ==========================================
    // TEMPLATE 6: CRM AUTOMATION
    // ==========================================
    crm_agent: {
        meta: {
            templateId: 'crm_agent',
            templateName: 'CRM Autopilot',
            templateDescription: 'Gestão automática de pipeline, qualificação de leads e follow-up.',
            version: '3.0.0',
            category: 'automation'
        },
        baseConfig: {
            identity: {
                name: 'Gerente de Contas Virtual',
                category: 'assistant',
                class: 'StandardAgent',
                specializationLevel: 3,
                description: 'Agente administrativo para gestão de CRM e tarefas repetitivas de vendas.',
                status: 'active'
            },
            aiConfig: {
                provider: 'openai',
                model: 'gpt-4-turbo-preview',
                temperature: 0.5,
                responseMode: 'balanced'
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'semantic',
                filters: ['Histórico do Cliente', 'Emails Anteriores']
            },
            prompts: {
                system: `Você é o CRM Autopilot.
Sua função é garantir que nenhum lead seja esquecido.

## Tarefas:
1. Classificar novos leads (BANT).
2. Agendar follow-ups.
3. Atualizar status no CRM.`,

                vectorSearch: `Busque: Histórico completo de interações com este lead em todos os canais.`
            }
        },
        parameters: [
            {
                key: 'bant_criteria',
                label: 'Critérios BANT',
                type: 'textarea',
                defaultValue: 'Budget: >R$5k\nAuthority: Diretor/Gerente\nNeed: Imediata\nTimeline: <30 dias',
                displayOrder: 1
            }
        ],
        groups: [
            { id: 'config', label: 'Configuração', order: 1 }
        ]
    },

    // ==========================================
    // TEMPLATE 7: FAQ DINÂMICO
    // ==========================================
    dynamic_faq: {
        meta: {
            templateId: 'dynamic_faq',
            templateName: 'FAQ Dinâmico Inteligente',
            templateDescription: 'Transforma documentos estáticos em um especialista de Tira-Dúvidas.',
            version: '3.0.0',
            category: 'support'
        },
        baseConfig: {
            identity: {
                name: 'Knowledge Bot',
                category: 'service',
                class: 'StandardAgent',
                specializationLevel: 3,
                status: 'active'
            },
            aiConfig: {
                temperature: 0.3,
                provider: 'openai',
                model: 'gpt-4-turbo-preview',
                responseMode: 'concise'
            },
            vectorConfig: {
                enableRag: true,
                chunkingMode: 'semantic',
                chunkSize: 400,
                sensitivity: 8,
                relevanceThreshold: 0.82
            },
            prompts: {
                system: `Você responde perguntas baseado EXCLUSIVAMENTE na base de conhecimento fornecida.
Se a informação não estiver nos documentos, diga: "Desculpe, não encontrei essa informação na minha base oficial."`,

                validation: `Verifique se a resposta contém alguma informação que não está nos chunks recuperados. Se sim, remova.`
            }
        },
        parameters: [],
        groups: []
    }
};

module.exports = agentTemplates;
