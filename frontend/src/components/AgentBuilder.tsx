import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
    Brain, Save, Database, MessageSquare,
    Shield, Fingerprint, Wand2, Smartphone, Check,
    LayoutTemplate, X, Loader2, RefreshCw, Zap,
    Globe, Copy, ExternalLink, Store, Trash2, Edit
} from 'lucide-react';
import { ClientSelector } from './common/ClientSelector';
// Tipos baseados na especificação do usuário
interface AgentConfig {
    identity: {
        name: string;
        category: string;
        description: string;
        class: string;
        specializationLevel: number;
        status: 'active' | 'inactive';
    };
    aiConfig: {
        provider: string;
        model: string;
        temperature: number;
        topP: number;
        topK: number;
        maxTokens: number;
        timeout: number;
        retries: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
        responseMode?: string;
        candidateCount?: number;
        stopSequences?: string[];
        seed?: number;
        jsonMode?: boolean;
    };
    vectorConfig: {
        chunkingMode: 'semantic' | 'fixed' | 'hierarchical';
        chunkSize: number;
        sensitivity: number;
        contextWindow: number;
        relevanceThreshold: number;
        filters: string[];
        knowledgeBaseId?: string;
        searchMode?: 'semantic' | 'keyword' | 'hybrid';
        enableReranking?: boolean;
        // Configurações Avançadas de Chunking
        chunkingStrategy?: 'paragraph' | 'fixed' | 'semantic';
        chunkDelimiter?: string;
        maxChunkSize?: number;
        chunkOverlap?: number;
        childChunkSize?: number;
        preprocessing?: {
            removeExtraSpaces: boolean;
            removeUrls: boolean;
            removeEmails: boolean;
        };
        // Embeddings Híbridos
        hybridConfig?: {
            semanticPrecision: number;
            contextualWeight: number;
        };
        // Reranking Avançado
        rerankConfig?: {
            topK: number;
            threshold: number;
        };
    };
    advancedConfig?: {
        kpis?: { name: string; target: string }[];
        multiModelValidation: {
            enabled: boolean;
            minConsensus: number;
            parallelModels: number;
        };
        promptEngineering: {
            analysisDepth: number;
            chainOfThought: 'none' | 'basic' | 'advanced';
        };
        qualitySafety: {
            hallucinationCheck: {
                enabled: boolean;
                sensitivity: number;
                method: 'cross-reference' | 'self-consistency';
            };
            semanticCache: {
                enabled: boolean;
                similarityThreshold: number;
                ttlHours: number;
            };
            monitoring: {
                logFrequency: 'all' | 'errors' | 'critical';
                confidenceThreshold: number;
            };
        };
    };
    prompts: {
        system: string;
        responseStructure: string;
        vectorSearch: string;
        analysis: string;
        complexCases: string;
        validation: string;
        scriptContent?: string;
    };
    whatsappConfig: {
        enabled: boolean;
        provider: 'official' | 'evolution_api';
        official: {
            phoneNumberId: string;
            accessToken: string;
            verifyToken: string;
        };
        evolution: {
            baseUrl: string;
            apiKey: string;
            instanceName: string;
        };
    };
}
const INITIAL_CONFIG: AgentConfig = {
    identity: {
        name: '',
        category: 'service',
        description: '',
        class: 'StandardAgent',
        specializationLevel: 1,
        status: 'active'
    },
    aiConfig: {
        provider: 'openai',
        model: 'gpt-5-mini',
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxTokens: 2000,
        timeout: 60,
        retries: 3,
        frequencyPenalty: 0,
        presencePenalty: 0,
        responseMode: 'balanced',
        candidateCount: 1
    },
    vectorConfig: {
        chunkingMode: 'semantic',
        chunkSize: 500,
        sensitivity: 5,
        contextWindow: 5,
        relevanceThreshold: 0.70,
        filters: [],
        knowledgeBaseId: '',
        searchMode: 'hybrid',
        enableReranking: true,
        chunkingStrategy: 'paragraph',
        chunkDelimiter: '\\n\\n',
        maxChunkSize: 2048,
        chunkOverlap: 100,
        childChunkSize: 768,
        preprocessing: {
            removeExtraSpaces: true,
            removeUrls: true,
            removeEmails: true
        },
        hybridConfig: {
            semanticPrecision: 0.85,
            contextualWeight: 0.25
        },
        rerankConfig: {
            topK: 10,
            threshold: 0.75
        }
    },
    advancedConfig: {
        kpis: [],
        multiModelValidation: {
            enabled: true,
            minConsensus: 0.75,
            parallelModels: 3
        },
        promptEngineering: {
            analysisDepth: 3,
            chainOfThought: 'advanced'
        },
        qualitySafety: {
            hallucinationCheck: {
                enabled: true,
                sensitivity: 0.80,
                method: 'cross-reference'
            },
            semanticCache: {
                enabled: true,
                similarityThreshold: 0.90,
                ttlHours: 6
            },
            monitoring: {
                logFrequency: 'critical',
                confidenceThreshold: 0.70
            }
        }
    },
    prompts: {
        scriptContent: '',
        system: '',
        responseStructure: '',
        vectorSearch: '',
        analysis: '',
        complexCases: '',
        validation: ''
    },
    whatsappConfig: {
        enabled: false,
        provider: 'evolution_api',
        official: {
            phoneNumberId: '',
            accessToken: '',
            verifyToken: ''
        },
        evolution: {
            baseUrl: '',
            apiKey: '',
            instanceName: ''
        }
    }
};
export const AgentBuilder: React.FC = () => {
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get('template');

    const [activeTab, setActiveTab] = useState<'store' | 'identity' | 'ai' | 'vector' | 'prompts' | 'channels' | 'advanced' | 'deploy'>('store');
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [config, setConfig] = useState<AgentConfig>(INITIAL_CONFIG);

    // Estado para Loja de Agentes
    const [agentsList, setAgentsList] = useState<any[]>([]);
    const [loadingAgents, setLoadingAgents] = useState(false);

    useEffect(() => {
        if (activeTab === 'store') {
            fetchAgents();
        }
    }, [activeTab]);

    const fetchAgents = async () => {
        setLoadingAgents(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAgentsList(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Erro ao buscar agentes:', error);
        } finally {
            setLoadingAgents(false);
        }
    };

    const handleDeleteAgent = async (agentId: number) => {
        if (!confirm('Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/${agentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Agente excluído com sucesso!');
                fetchAgents();
            } else {
                alert('Erro ao excluir agente.');
            }
        } catch (error) {
            console.error('Erro ao excluir agente:', error);
            alert('Erro ao excluir agente.');
        }
    };

    const handleEditAgent = async (agent: any) => {
        // Mapear dados do agente para o estado de configuração
        // Nota: A estrutura retornada pela API pode variar, aqui assumimos um mapeamento básico para edição
        // Em um cenário real, precisaríamos de um endpoint GET /api/agents/:id com todos os detalhes

        // Simulação de carregamento de dados para edição (Idealmente buscaria fresh data do backend)
        try {
            // Endpoint imaginário para pegar full details se a lista for resumida. 
            // Se a lista já tem tudo, usar 'agent' direto. Vamos assumir que precisamos de reload para garantir.
            // Mas para este MVP, vamos usar o que temos ou o que o backend retorna no POST

            // Se o backend retornar 'advanced_settings' e 'ai_config' flat ou aninhado, precisamos adaptar.
            // PROVISÓRIO: Resetar config e preencher com dados conhecidos
            setConfig({
                ...INITIAL_CONFIG,
                identity: {
                    name: agent.name,
                    category: agent.category || '',
                    description: agent.description || '',
                    class: agent.class || 'SaaS',
                    specializationLevel: agent.specialization_level || 5,
                    status: agent.status
                },
                // Preencher outros campos se disponíveis no objeto agent da lista
                // Caso contrário, o ideal seria implementar GET /api/agents/:id no backend
            });

            // Marcar ID do agente em edição se necessário (não temos state para isso ainda no componente, 
            // talvez adicionar 'editingAgentId' state futuramente para UPDATE em vez de CREATE)

            alert('Modo de edição iniciado. (Nota: Para edição completa, certifique-se que o backend retorna todos os dados na lista ou implemente GET by ID).');
            setActiveTab('identity');
        } catch (e) {
            console.error(e);
        }
    };

    const TABS = [
        { id: 'store', label: 'Loja de Agentes', icon: Store },
        { id: 'identity', label: 'Identidade & Perfil', icon: Fingerprint },
        { id: 'ai', label: 'Parâmetros de IA', icon: Brain },
        { id: 'vector', label: 'Base Vetorial (RAG)', icon: Database },
        { id: 'prompts', label: 'Engenharia de Prompt', icon: MessageSquare },
        { id: 'channels', label: 'Canais & Integrações', icon: Smartphone },
        { id: 'advanced', label: 'Otimização Avançada', icon: Zap },
        { id: 'deploy', label: 'Deploy & Widget', icon: LayoutTemplate },
    ];

    // Estado para Qdrant
    const [qdrantCollections, setQdrantCollections] = useState<any[]>([]);
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [qdrantConnected, setQdrantConnected] = useState(false);
    // Estado para Salvar Template
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    // Estado para Configuração Mágica
    const [showMagicModal, setShowMagicModal] = useState(false);
    const [magicDescription, setMagicDescription] = useState('');
    const [isGeneratingConfig, setIsGeneratingConfig] = useState(false);
    // Estado para Carregar Template
    const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [showSetupButton, setShowSetupButton] = useState(false);
    const saveAgentMutation = useMutation({
        mutationFn: async (agentConfig: AgentConfig) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...agentConfig, clientId: selectedClientId })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao salvar agente');
            }
            return response.json();
        },
        onSuccess: (data) => {
            alert(`Agente "${data.name}" salvo com sucesso! (ID: ${data.id})`);
        },
        onError: (error: any) => {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar agente: ' + error.message);
        }
    });
    const testConnectionMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                provider: config.whatsappConfig.provider,
                config: config.whatsappConfig.provider === 'evolution_api'
                    ? config.whatsappConfig.evolution
                    : config.whatsappConfig.official
            };
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agents/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                alert('✅ ' + data.message);
            } else {
                alert('❌ ' + data.message);
            }
        },
        onError: (error: any) => {
            console.error('Erro no teste:', error);
            alert('Erro ao testar conexão: ' + error.message);
        }
    });
    const handleSaveAgent = () => {
        saveAgentMutation.mutate(config);
    };
    const handleTestConnection = () => {
        testConnectionMutation.mutate();
    };
    // Carregar coleções do Qdrant
    const loadQdrantCollections = async () => {
        setLoadingCollections(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/qdrant/collections`);
            const data = await response.json();
            if (data.success) {
                setQdrantCollections(data.collections);
                setQdrantConnected(true);
            } else {
                console.error('Erro ao carregar coleções:', data.error);
                setQdrantConnected(false);
            }
        } catch (error) {
            console.error('Erro ao conectar com Qdrant:', error);
            setQdrantConnected(false);
        } finally {
            setLoadingCollections(false);
        }
    };
    // Testar conexão Qdrant
    const testQdrantConnection = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/qdrant/test`);
            const data = await response.json();
            if (data.success) {
                alert('✅ Conexão com Qdrant estabelecida com sucesso!');
                loadQdrantCollections();
            } else {
                alert('❌ Erro ao conectar: ' + data.error);
            }
        } catch (error: any) {
            alert('❌ Erro de conexão: ' + error.message);
        }
    };


    // Carregar coleções ao montar o componente
    useEffect(() => {
        if (activeTab === 'vector') {
            loadQdrantCollections();
        }
    }, [activeTab]);
    // Carregar template se existir na URL
    useEffect(() => {
        if (templateId) {
            const loadTemplate = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agent-templates/${templateId}`);
                    const data = await response.json();
                    if (data.base_config) {
                        // Merge robusto para garantir que novos campos (como advancedConfig ou prompts) não quebrem com templates antigos
                        setConfig({
                            ...INITIAL_CONFIG,
                            ...data.base_config,
                            identity: { ...INITIAL_CONFIG.identity, ...(data.base_config.identity || {}) },
                            aiConfig: { ...INITIAL_CONFIG.aiConfig, ...(data.base_config.aiConfig || {}) },
                            vectorConfig: { ...INITIAL_CONFIG.vectorConfig, ...(data.base_config.vectorConfig || {}) },
                            prompts: { ...INITIAL_CONFIG.prompts, ...(data.base_config.prompts || {}) },
                            whatsappConfig: { ...INITIAL_CONFIG.whatsappConfig, ...(data.base_config.whatsappConfig || {}) },
                            advancedConfig: { ...INITIAL_CONFIG.advancedConfig, ...(data.base_config.advancedConfig || {}) }
                        });
                    }
                } catch (error) {
                    console.error('Erro ao carregar template:', error);
                    alert('Erro ao carregar o template selecionado.');
                }
            };
            loadTemplate();
        }
    }, [templateId]);
    const handleSaveTemplate = async () => {
        if (!templateName) {
            alert('Por favor, dê um nome ao template.');
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agent-templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: templateName.toLowerCase().replace(/\s+/g, '_'),
                    template_name: templateName,
                    template_description: templateDescription,
                    category: 'custom',
                    base_config: config,
                    default_parameters: [] // Pode ser expandido no futuro
                })
            });
            if (response.ok) {
                alert('Template salvo com sucesso!');
                setShowSaveTemplateModal(false);
                setTemplateName('');
                setTemplateDescription('');
            } else {
                const error = await response.json();
                alert('Erro ao salvar template: ' + error.error);
            }
        } catch (error: any) {
            alert('Erro ao salvar template: ' + error.message);
        }
    };
    const handleMagicConfig = async () => {
        if (!magicDescription) return;
        setIsGeneratingConfig(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/generate-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: magicDescription })
            });
            const data = await response.json();
            if (data.error) {
                alert('Erro ao gerar configuração: ' + data.error);
            } else {
                // Mesclar com a configuração atual, mantendo o que não foi gerado
                setConfig(prev => ({
                    ...prev,
                    identity: { ...prev.identity, ...data.identity },
                    aiConfig: { ...prev.aiConfig, ...data.aiConfig },
                    prompts: { ...prev.prompts, ...data.prompts }
                }));
                setShowMagicModal(false);
                setMagicDescription('');
                alert('✨ Configuração Mágica aplicada com sucesso!');
            }
        } catch (error: any) {
            console.error('Erro na Configuração Mágica:', error);
            alert('Falha ao gerar configuração: ' + error.message);
        } finally {
            setIsGeneratingConfig(false);
        }
    };
    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agent-templates`);
            const data = await response.json();

            // Garantir que data é um array válido
            if (Array.isArray(data)) {
                setAvailableTemplates(data);
                if (data.length === 0) setShowSetupButton(true);
            } else if (data.templates && Array.isArray(data.templates)) {
                setAvailableTemplates(data.templates);
                if (data.templates.length === 0) setShowSetupButton(true);
            } else {
                console.warn('Formato de templates inesperado:', data);
                setAvailableTemplates([]);
                setShowSetupButton(true);
            }

            setShowLoadTemplateModal(true);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
            // alert('Erro ao carregar lista de templates.');
            setAvailableTemplates([]);
            setShowSetupButton(true);
        } finally {
            setLoadingTemplates(false);
        }
    };


    const handleSetupTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agent-templates/setup-db`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                alert('Templates inicializados com sucesso!');
                setShowSetupButton(false);
                fetchTemplates();
            } else {
                alert('Erro ao inicializar: ' + (data.error || data.message));
            }
        } catch (error) {
            console.error('Erro setup:', error);
            alert('Erro ao conectar para inicialização.');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleSelectTemplate = async (templateId: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/agent-templates/${templateId}`);
            const data = await response.json();
            if (data.base_config) {
                setConfig({
                    ...INITIAL_CONFIG,
                    ...data.base_config,
                    identity: { ...INITIAL_CONFIG.identity, ...(data.base_config.identity || {}) },
                    aiConfig: { ...INITIAL_CONFIG.aiConfig, ...(data.base_config.aiConfig || {}) },
                    vectorConfig: { ...INITIAL_CONFIG.vectorConfig, ...(data.base_config.vectorConfig || {}) },
                    prompts: { ...INITIAL_CONFIG.prompts, ...(data.base_config.prompts || {}) },
                    whatsappConfig: { ...INITIAL_CONFIG.whatsappConfig, ...(data.base_config.whatsappConfig || {}) },
                    advancedConfig: { ...INITIAL_CONFIG.advancedConfig, ...(data.base_config.advancedConfig || {}) }
                });
                setShowLoadTemplateModal(false);
                alert('Template carregado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao carregar template:', error);
            alert('Erro ao carregar o template selecionado.');
        }
    };

    const applyAiPreset = (preset: string) => {
        let newConfig = { ...config.aiConfig };

        switch (preset) {
            case 'creative':
                newConfig = {
                    ...newConfig,
                    temperature: 0.9,
                    topP: 0.95,
                    topK: 60,
                    maxTokens: 4000,
                    timeout: 60,
                    retries: 3,
                    presencePenalty: 0.3,
                    frequencyPenalty: 0.3,
                    responseMode: 'detailed',
                    candidateCount: 1,
                    seed: undefined, // Aleatório para criatividade
                    jsonMode: false
                };
                break;
            case 'precise':
                newConfig = {
                    ...newConfig,
                    temperature: 0.1,
                    topP: 0.7,
                    topK: 30,
                    maxTokens: 2000,
                    timeout: 60,
                    retries: 3,
                    presencePenalty: 0,
                    frequencyPenalty: 0,
                    responseMode: 'concise',
                    candidateCount: 1,
                    seed: 12345, // Seed fixa para reprodutibilidade
                    jsonMode: false
                };
                break;
            case 'balanced':
                newConfig = {
                    ...newConfig,
                    temperature: 0.5,
                    topP: 0.9,
                    topK: 40,
                    maxTokens: 2000,
                    timeout: 60,
                    retries: 3,
                    presencePenalty: 0,
                    frequencyPenalty: 0,
                    responseMode: 'balanced',
                    candidateCount: 1,
                    seed: undefined,
                    jsonMode: false
                };
                break;
            case 'coding':
                newConfig = {
                    ...newConfig,
                    temperature: 0.05,
                    topP: 0.8,
                    topK: 40,
                    maxTokens: 8000, // Mais tokens para código
                    timeout: 90, // Mais tempo para pensar
                    retries: 3,
                    presencePenalty: 0,
                    frequencyPenalty: 0,
                    responseMode: 'concise',
                    candidateCount: 1,
                    seed: undefined,
                    jsonMode: false
                };
                break;
        }
        setConfig({ ...config, aiConfig: newConfig });
    };

    const applyPromptPreset = (preset: string) => {
        console.log('Applying prompt preset:', preset);
        // Criação explícita do objeto para garantir que todos os campos existam
        const basePrompts = {
            system: '',
            responseStructure: '',
            vectorSearch: '',
            analysis: '',
            complexCases: '',
            validation: '',
            scriptContent: ''
        };

        let newPrompts = { ...basePrompts, ...config.prompts };

        switch (preset) {
            case 'sales':
                newPrompts.system = `ATUAÇÃO: Você é um Consultor de Vendas Especialista em [INSERIR SEU NICHO].
MISSÃO: Vender [INSERIR NOME DO PRODUTO/SERVIÇO] focando na transformação do cliente.
TOM DE VOZ: Profissional, Persuasivo e Empático.
REGRAS:
1. Use a metodologia SPIN Selling (Situação, Problema, Implicação, Necessidade).
2. Nunca fale o preço antes de gerar valor.
3. Se o cliente disser "está caro", use o argumento: [INSERIR ARGUMENTO DE VALOR].`;

                newPrompts.responseStructure = `1. **Validação**: "Entendi, você precisa de [REPETIR NECESSIDADE DO CLIENTE]..."
2. **Conexão**: "Nossa solução ajuda exatamente nisso porque..."
3. **Prova Social**: "Temos clientes como [INSERIR CLIENTE EXEMPLO] que tiveram esse resultado..."
4. **CTA (Chamada para Ação)**: [INSERIR SEU OBJETIVO: AGENDAR, VENDER, CADASTRAR]`;

                newPrompts.vectorSearch = `BUSCA ESTRATÉGICA:
- Tabela de Preços e Planos: [INSERIR LINK OU NOME DO DOC]
- Comparativo vs Concorrentes ([INSERIR NOME DO CONCORRENTE])
- Cases de Sucesso do Setor [INSERIR SETOR]
- Tira-dúvidas Técnicas sobre [INSERIR FUNCIONALIDADE PRINCIPAL]`;

                newPrompts.analysis = `CRITÉRIOS DE QUALIFICAÇÃO (BANT):
- Budget (Orçamento): O cliente tem potencial financeiro para [INSERIR VALOR MÍNIMO]?
- Authority (Autoridade): Ele é o decisor?
- Need (Necessidade): A dor dele é [INSERIR DOR QUE SEU PRODUTO RESOLVE]?
- Timeline (Tempo): Ele precisa para agora ou futuro?

SINAIS DE ALERTA:
- Cliente foca apenas em "preço" e ignora "valor".
- Cliente pede features que não temos ([LISTAR O QUE NÃO FAZEMOS]).`;

                newPrompts.complexCases = `CENÁRIO 1: Cliente pede desconto agressivo.
RESPOSTA: [INSERIR POLÍTICA DE DESCONTOS].

CENÁRIO 2: Cliente cita o concorrente [NOME].
ARGUMENTO: "Eles são bons, mas nosso diferencial exclusivo é [SEU DIFERENCIAL]."

CENÁRIO 3: Cliente diz "vou pensar".
AÇÃO: Criar senso de urgência com [INSERIR GATILHO: BÔNUS, VAGAS, TEMPO].`;

                newPrompts.validation = `CHECKLIST DE RESPOSTA:
1. A resposta atacou a dor principal do cliente?
2. O preço (se mencionado) está de acordo com a tabela [ANO ATUAL]?
3. O CTA leva para o link de checkout/agendamento correto?
4. Não prometemos resultados impossíveis como [PROMESSA FALSA A EVITAR]?`;

                newPrompts.scriptContent = `FASE 1: INVESTIGAÇÃO
- Pergunta: "Qual o maior desafio que você enfrenta hoje com [TEMA]?"
- Pergunta: "O que acontece se você não resolver isso?"

FASE 2: APRESENTAÇÃO
- "Com base no que me disse, o [SEU PRODUTO] é ideal porque..."

FASE 3: FECHAMENTO
- "Prefere pagar no cartão ou boleto?" / "Fica bom para você quarta às 15h?"`;
                break;

            case 'support':
                newPrompts.system = `ATUAÇÃO: Agente de Suporte Técnico Nível [1 ou 2].
OBJETIVO: Resolver tickets sobre [INSERIR PRODUTO/SISTEMA] rapidamente.
POSTURA: Didático, Paciente e Resolutivo.
PROIBIDO: Culpar o usuário ou usar termos técnicos sem explicação.
SE NÃO SOUBER: Consulte a base ou diga "Vou verificar com a equipe técnica".`;

                newPrompts.responseStructure = `1. **Empatia**: "Sinto muito que você esteja com problemas em [FUNCIONALIDADE]..."
2. **Origem do erro**: "Isso geralmente acontece quando [EXPLICAÇÃO SIMPLES]."
3. **Solução**:
   - Passo A: [AÇÃO]
   - Passo B: [AÇÃO]
4. **Confirmação**: "Conseguiu realizar o passo A?"`;

                newPrompts.vectorSearch = `PRIORIDADE DE BUSCA:
1. Códigos de Erro: [LISTAR CÓDIGOS COMUNS EX: #404, #500]
2. Manuais de Instalação: [VERSÃO ATUAL DO SOFTWARE]
3. Problemas Conhecidos (Bugs em aberto)
4. Procedimentos de Reset de Senha/Conta`;

                newPrompts.analysis = `DIAGNÓSTICO AUTOMÁTICO:
- Gravidade: O sistema está parado (Crítico) ou é dúvida (Baixo)?
- Humor do Cliente: Irritado (Requer empatia extra) ou Calmo?
- Categoria: [INSERIR CATEGORIAS: FINANCEIRO, ACESSO, BUG, DÚVIDA]`;

                newPrompts.complexCases = `CASO CRÍTICO: Sistema fora do ar.
AÇÃO: Confirmar status em [STATUS PAGE URL] e dar previsão.

CASO RECORRENTE: O mesmo erro volta sempre.
AÇÃO: Escalar para Nível 2 e abrir ticket no Jira.

CASO DE REEMBOLSO: Cliente pede dinheiro de volta.
POLÍTICA: [INSERIR REGRAS DE REEMBOLSO].`;

                newPrompts.validation = `SEGURANÇA:
- O procedimento envolve risco de perda de dados? Se sim, avisar: "Faça backup antes".
- Estamos enviando links seguros (apenas domínio oficial)?
- A resposta resolve o ticket ou apenas posterga?`;

                newPrompts.scriptContent = `ROTEIRO DE ATENDIMENTO PADRÃO:
1. Saudação + Pedido de Nº do Pedido/Conta.
2. Identificação do Problema (Peça prints se necessário).
3. Busca na Base de Conhecimento.
4. Instrução de Solução.
5. "Posso ajudar em algo mais?"`;
                break;

            case 'legal':
                newPrompts.system = `ATUAÇÃO: Assistente Jurídico Virtual do Escritório [NOME DO ESCRITÓRIO].
ÁREA: Direito [INSERIR ÁREA: CIVIL, TRABALHISTA, TRIBUTÁRIO].
RESTRIÇÃO: Você NÃO é um advogado humano. Sempre use disclaimers.
FONTE: Responda apenas com base na Lei [INSERIR LEIS RELEVANTES] e na Jurisprudência fornecida.`;

                newPrompts.responseStructure = `1. **Entendimento**: "O caso trata de [RESUMO JURÍDICO DO FATO]."
2. **Legislação**: "Conforme o Artigo [NÚMERO] da Lei [NOME]..."
3. **Jurisprudência**: "O entendimento majoritário é..."
4. **Orientação**: "Recomenda-se providenciar [LISTA DE DOCUMENTOS]."
5. **Aviso Legal**: "Esta é uma análise preliminar via IA."`;

                newPrompts.vectorSearch = `DOCS JURÍDICOS:
- Constituição Federal e Códigos (CC, CPC, CLT)
- Súmulas Vinculantes do STF sobre [TEMA]
- Modelos de Contrato Padrão do Escritório
- Doutrina sobre [TEMA ESPECÍFICO]`;

                newPrompts.analysis = `ANÁLISE DE RISCO:
- Risco de Prescrição? (Verificar datas)
- Competência Territorial: Onde ocorreu o fato?
- Valor da Causa Estimado: [ALTO/MÉDIO/BAIXO]
- Documentação: Está completa ou faltam provas?`;

                newPrompts.complexCases = `CONFLITO DE LEIS: Quando houver duas interpretações, cite ambas.
TEMA POLÊMICO: "Há divergência nos tribunais [CITAR TRIBUNAL A vs TRIBUNAL B]."
URGÊNCIA: Se prazo vence hoje, ALERTE EM CAIXA ALTA.`;

                newPrompts.validation = `CHECKLIST DE COMPLIANCE:
- A lei citada está vigente? (Não foi revogada?)
- O termo jurídico está correto?
- O disclaimer de IA está presente?
- Não houve promessa de "ganho de causa" (proibido pela OAB)?`;

                newPrompts.scriptContent = `FLUXO DE TRIAGEM JURÍDICA:
1. "Qual a data do ocorrido?" (Para prescrição)
2. "Houve contrato assinado?"
3. "Qual o valor envolvido?"
4. "Já existe processo em andamento? Se sim, qual o número?"`;
                break;

            case 'marketing':
                newPrompts.system = `ATUAÇÃO: Copywriter Sênior para a Marca [NOME DA MARCA].
PÚBLICO-ALVO: [DEFINIR PERSONA: IDADE, INTERESSES].
OBJETIVO: Criar conteúdo para [INSTAGRAM/LINKEDIN/BLOG] que engaje e converta.
ESTILO: [DEFINIR TOM: DIVERTIDO, SÉRIO, INSPIRADOR].`;

                newPrompts.responseStructure = `1. **Gancho (Hook)**: "Sabia que [FATO CURIOSO/ESTATÍSTICA]?"
2. **História**: "Muitos clientes nossos passavam por [DOR]..."
3. **Virada**: "Até que conheceram o [PRODUTO]..."
4. **Benefício**: "O resultado foi [RESULTADO]."
5. **CTA**: "[AÇÃO DESEJADA]"`;

                newPrompts.vectorSearch = `REFERÊNCIAS CRIATIVAS:
- Brandbook e Guia de Tom de Voz da Marca
- Campanhas de Sucesso de [ANO/MÊS ANTERIOR]
- Dados de Pesquisa de Mercado sobre [NICHO]
- Tendências Virais Atuais (Trends)`;

                newPrompts.analysis = `ANÁLISE DE POTENCIAL:
- O título é "clicável" (Clickbait saudável)?
- O texto foca na dor ou no prazer da persona?
- A linguagem está adequada para a plataforma [PLATAFORMA]?
- Gatilhos usados: [LISTAR GATILHOS DETECTADOS]`;

                newPrompts.complexCases = `CRISE DE IMAGEM: Se o usuário criticar a marca.
RESPOSTA: Empatia total + Levar para Direct/Privado.
HATERS: Responder com elegância ou ignorar (conforme política).
POLÍTICA: Evitar temas sensíveis como [LISTAR TEMAS PROIBIDOS].`;

                newPrompts.validation = `REVISÃO FINAL:
- Ortografia e Gramática impecáveis?
- Emojis estão adequados ao tom? 🚀
- As hashtags são relevantes? #[TAG]
- O texto respeita o limite de caracteres da rede?`;

                newPrompts.scriptContent = `ROTEIRO DE CRIAÇÃO DE CAMPANHA:
1. Definir a "Big Idea" (Conceito central).
2. Selecionar formatos (Reels, Carrosel, Story).
3. Escrever Legendas (Captions).
4. Definir Criativos Visuais (Briefing p/ Designer).
5. Agendar postagem.`;
                break;
        }

        // Forçar atualização do estado visualmente
        setConfig(prev => ({
            ...prev,
            prompts: { ...prev.prompts, ...newPrompts }
        }));

        alert(`Template [${preset.toUpperCase()}] aplicado com sucesso! Preencha os campos entre colchetes [ ].`);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 animate-fade-in min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-800">Construtor de Agentes IA</h2>
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full uppercase">Enterprise Edition</span>
                    </div>
                    <p className="text-sm text-gray-500">Configure agentes especializados com parâmetros avançados de RAG e Engenharia de Prompt.</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="w-64">
                        <ClientSelector
                            selectedClientId={selectedClientId}
                            onSelectClient={setSelectedClientId}
                        />
                    </div>
                    <button
                        onClick={() => window.open('/whatsapp-simulator', '_blank')}
                        className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium flex items-center gap-2 border border-green-200"
                    >
                        <MessageSquare size={18} /> Simular WhatsApp
                    </button>
                    <button
                        onClick={() => setShowMagicModal(true)}
                        className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium flex items-center gap-2 border border-indigo-200"
                    >
                        <Wand2 size={18} /> Configuração Mágica
                    </button>
                    <button
                        onClick={fetchTemplates}
                        className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium flex items-center gap-2 border border-primary-200"
                    >
                        <LayoutTemplate size={18} /> Carregar Template
                    </button>
                    <button
                        onClick={() => setShowSaveTemplateModal(true)}
                        className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium flex items-center gap-2 border border-purple-200"
                    >
                        <Save size={18} /> Salvar como Template
                    </button>
                    <button
                        onClick={handleSaveAgent}
                        disabled={saveAgentMutation.isPending}
                        className={`px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-200 ${saveAgentMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <Save size={18} /> {saveAgentMutation.isPending ? 'Salvando...' : 'Salvar Agente'}
                    </button>
                </div>
            </div>
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Mobile Navigation */}
                <div className="md:hidden w-full bg-white border-b border-gray-200 overflow-x-auto shrink-0">
                    <nav className="flex p-2 gap-2 min-w-max">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Desktop Sidebar Navigation */}
                <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0">
                    <nav className="p-4 space-y-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* TAB: AGENT STORE */}
                        {activeTab === 'store' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <Store className="text-purple-600" /> Loja de Agentes
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setConfig(INITIAL_CONFIG);
                                            setActiveTab('identity');
                                        }}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow-lg flex items-center gap-2"
                                    >
                                        <Wand2 size={18} /> Criar Novo Agente
                                    </button>
                                </div>

                                {loadingAgents ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="animate-spin text-purple-600" size={48} />
                                    </div>
                                ) : agentsList.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                                        <Store className="mx-auto text-gray-300 mb-4" size={64} />
                                        <p className="text-gray-500 text-lg">Nenhum agente criado ainda.</p>
                                        <p className="text-gray-400 text-sm">Crie seu primeiro agente para vê-lo aqui.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {agentsList.map((agent) => (
                                            <div key={agent.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                                <div className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${agent.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                            <Brain size={24} />
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {agent.status === 'active' ? 'Ativo' : 'Inativo'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{agent.name}</h4>
                                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{agent.description || 'Sem descrição.'}</p>

                                                    <div className="flex flex-col gap-2 mb-4">
                                                        <div className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded border border-gray-100">
                                                            <code className="text-xs text-gray-500 font-mono break-all">
                                                                {agent.slug ? `${window.location.origin}/agent/${agent.slug}` : 'Sem link público'}
                                                            </code>
                                                            {agent.slug && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigator.clipboard.writeText(`${window.location.origin}/agent/${agent.slug}`);
                                                                        alert('Link copiado para a área de transferência!');
                                                                    }}
                                                                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors shrink-0"
                                                                    title="Copiar Link"
                                                                >
                                                                    <Copy size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 border-t pt-4">
                                                        <button
                                                            onClick={() => handleEditAgent(agent)}
                                                            className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                                        >
                                                            <Edit size={16} /> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAgent(agent.id)}
                                                            className="flex-1 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                                        >
                                                            <Trash2 size={16} /> Excluir
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: IDENTIDADE */}
                        {activeTab === 'identity' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Fingerprint className="text-primary-500" /> Identidade do Agente
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Agente</label>
                                            <input id="agent-name" type="text" value={config.identity.name} onChange={(e) => setConfig({ ...config, identity: { ...config.identity, name: e.target.value } })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                        <div>
                                            <label htmlFor="agent-category" className="block text-sm font-medium text-gray-700 mb-1">Categoria Jurídica</label>
                                            <select id="agent-category" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white">
                                                <option value="service">Atendimento ao Cliente</option>
                                                <option value="sales">Vendas & Comercial</option>
                                                <option value="specialist">Especialista Técnico</option>
                                                <option value="assistant">Assistente Geral</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label htmlFor="agent-description" className="block text-sm font-medium text-gray-700 mb-1">Descrição do Agente</label>
                                            <textarea id="agent-description" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" rows={2} value={config.identity.description} onChange={(e) => setConfig({ ...config, identity: { ...config.identity, description: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label htmlFor="agent-class" className="block text-sm font-medium text-gray-700 mb-1">Classe do Agente</label>
                                            <select
                                                id="agent-class"
                                                value={config.identity.class}
                                                onChange={(e) => setConfig({ ...config, identity: { ...config.identity, class: e.target.value } })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                                            >
                                                <option value="StandardAgent">Standard Agent (Padrão)</option>
                                                <option value="SalesAgent">Vendedor / Comercial</option>
                                                <option value="SupportAgent">Suporte Técnico</option>
                                                <option value="CSRAgent">SAC / Atendimento</option>
                                                <option value="AnalystAgent">Analista de Dados</option>
                                                <option value="LegalAgent">Assistente Jurídico</option>
                                                <option value="MarketingAgent">Estrategista de Marketing</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="agent-level" className="block text-sm font-medium text-gray-700 mb-1">Nível de Especialização</label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    id="agent-level"
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={config.identity.specializationLevel}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        identity: { ...config.identity, specializationLevel: parseInt(e.target.value) }
                                                    })}
                                                    className="flex-1"
                                                />
                                                <span className="font-bold text-primary-600">
                                                    {config.identity.specializationLevel} - {
                                                        config.identity.specializationLevel === 1 ? 'Iniciante' :
                                                            config.identity.specializationLevel === 2 ? 'Básico' :
                                                                config.identity.specializationLevel === 3 ? 'Intermediário' :
                                                                    config.identity.specializationLevel === 4 ? 'Avançado' : 'Especialista'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* TAB: IA CONFIG */}
                        {activeTab === 'ai' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Presets de Comportamento */}
                                <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="text-primary-600" size={20} />
                                        <div>
                                            <h4 className="text-sm font-bold text-primary-900">Configuração Rápida</h4>
                                            <p className="text-xs text-primary-700">Aplique as melhores práticas para seu caso de uso.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => applyAiPreset('precise')} className="px-3 py-1.5 bg-white text-primary-700 text-xs font-bold rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors">Preciso</button>
                                        <button onClick={() => applyAiPreset('balanced')} className="px-3 py-1.5 bg-white text-primary-700 text-xs font-bold rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors">Equilibrado</button>
                                        <button onClick={() => applyAiPreset('creative')} className="px-3 py-1.5 bg-white text-primary-700 text-xs font-bold rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors">Criativo</button>
                                        <button onClick={() => applyAiPreset('coding')} className="px-3 py-1.5 bg-white text-primary-700 text-xs font-bold rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors">Técnico/Code</button>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Brain className="text-purple-500" /> Configurações de Modelo (LLM)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Provedor de IA</label>
                                            <select
                                                value={config.aiConfig.provider}
                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, provider: e.target.value } })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                                            >
                                                <option value="openai">OpenAI (GPT-5 / GPT-4.1)</option>
                                                <option value="google">Google (Gemini 3 / 2.5)</option>
                                                <option value="anthropic">Anthropic (Claude)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                                            <select
                                                value={config.aiConfig.model}
                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, model: e.target.value } })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                                            >
                                                {config.aiConfig.provider === 'openai' && (
                                                    <>
                                                        <optgroup label="GPT-5 Series (Next Gen)">
                                                            <option value="gpt-5">GPT-5 Flagship (256K) - Raciocínio Automático</option>
                                                            <option value="gpt-5-pro">GPT-5 Pro (256K) - Tarefas Complexas</option>
                                                            <option value="gpt-5-mini">GPT-5 Mini (256K) - Balanceado</option>
                                                            <option value="gpt-5-nano">GPT-5 Nano (128K) - Rápido/Econômico</option>
                                                        </optgroup>
                                                        <optgroup label="GPT-4.1 Series (Production)">
                                                            <option value="gpt-4.1">GPT-4.1 (1M) - Docs Longos/Código</option>
                                                            <option value="gpt-4.1-mini">GPT-4.1 Mini (1M) - Custo Eficiente</option>
                                                            <option value="gpt-4.1-nano">GPT-4.1 Nano (1M) - Classificação</option>
                                                        </optgroup>
                                                        <optgroup label="Reasoning & Specialized">
                                                            <option value="o3">o3 (200K) - Raciocínio Matemático</option>
                                                            <option value="o4-mini">o4-mini (200K) - Raciocínio Leve</option>
                                                            <option value="gpt-image-1">GPT Image 1 - Geração de Imagens</option>
                                                        </optgroup>
                                                    </>
                                                )}
                                                {config.aiConfig.provider === 'google' && (
                                                    <>
                                                        <optgroup label="Gemini 3 (Preview)">
                                                            <option value="gemini-3-pro-preview">Gemini 3 Pro Preview - Vibe Coding</option>
                                                        </optgroup>
                                                        <optgroup label="Gemini 2.5 (Stable)">
                                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro - STEM/Código</option>
                                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash - Alto Volume</option>
                                                            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite - Ultra Rápido</option>
                                                        </optgroup>
                                                        <optgroup label="Legacy">
                                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                                        </optgroup>
                                                    </>
                                                )}
                                                {config.aiConfig.provider === 'anthropic' && (
                                                    <>
                                                        <optgroup label="Claude 4.5 (Latest)">
                                                            <option value="claude-opus-4-5-20251124">Opus 4.5 - Raciocínio Complexo/Agentes</option>
                                                            <option value="claude-sonnet-4-5-20250929">Sonnet 4.5 - Equilíbrio Ideal/Coding</option>
                                                            <option value="claude-haiku-4-5-20251001">Haiku 4.5 - Alta Velocidade/Tempo Real</option>
                                                        </optgroup>
                                                        <optgroup label="Claude 4.1 & 4">
                                                            <option value="claude-opus-4-1-20250805">Opus 4.1 - Raciocínio Avançado</option>
                                                            <option value="claude-opus-4-20250514">Opus 4 - Flagship Anterior</option>
                                                            <option value="claude-sonnet-4-20250514">Sonnet 4 - Performance Sólida</option>
                                                        </optgroup>
                                                        <optgroup label="Claude 3.7 & Legacy">
                                                            <option value="claude-3-7-sonnet-20250219">Sonnet 3.7 - Output Longo (128K)</option>
                                                            <option value="claude-3-5-haiku-20241022">Haiku 3.5 (Legacy)</option>
                                                            <option value="claude-3-haiku-20240307">Haiku 3 (Legacy)</option>
                                                        </optgroup>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-6 border-t border-gray-100 pt-6">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <label className="text-sm font-medium text-gray-700">Temperatura (Criatividade)</label>
                                                <span className="text-sm font-bold text-gray-900">{config.aiConfig.temperature}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                value={config.aiConfig.temperature}
                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, temperature: parseFloat(e.target.value) } })}
                                                className="w-full"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">0 = Determinístico, 2 = Muito Criativo</p>{/* Fixed encoding */}
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Top-P (Diversidade)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={config.aiConfig.topP}
                                                    onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, topP: parseFloat(e.target.value) } })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Top-K (Filtro de Tokens)</label>
                                                <input
                                                    type="number"
                                                    value={config.aiConfig.topK}
                                                    onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, topK: parseInt(e.target.value) } })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                                                <input
                                                    type="number"
                                                    value={config.aiConfig.maxTokens}
                                                    onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, maxTokens: parseInt(e.target.value) } })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (seg)</label>
                                                <input
                                                    type="number"
                                                    value={config.aiConfig.timeout}
                                                    onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, timeout: parseInt(e.target.value) } })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Retries</label>
                                                <input
                                                    type="number"
                                                    value={config.aiConfig.retries}
                                                    onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, retries: parseInt(e.target.value) } })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        {/* Parâmetros Avançados (Novos) */}
                                        <div className="border-t border-gray-200 pt-6">
                                            <h4 className="text-sm font-bold text-gray-800 mb-4">Parâmetros Avançados</h4>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency Penalty</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="2"
                                                        value={config.aiConfig.frequencyPenalty || 0}
                                                        onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, frequencyPenalty: parseFloat(e.target.value) } })}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Evitar repetições (0-2)</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Presence Penalty</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="2"
                                                        value={config.aiConfig.presencePenalty || 0}
                                                        onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, presencePenalty: parseFloat(e.target.value) } })}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Diversidade de vocabulário (0-2)</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modo de Resposta</label>
                                                    <select
                                                        value={config.aiConfig.responseMode || 'balanced'}
                                                        onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, responseMode: e.target.value } })}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                                                    >
                                                        <option value="concise">Conciso</option>
                                                        <option value="balanced">Balanceado</option>
                                                        <option value="detailed">Detalhado</option>
                                                        <option value="comprehensive">Abrangente</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Count</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="8"
                                                        value={config.aiConfig.candidateCount || 1}
                                                        onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, candidateCount: parseInt(e.target.value) } })}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Número de candidatos (1-8)</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta Parâmetros de Ajuste Fino (Novos) */}
                                        <div className="border-t border-gray-200 pt-6 mt-6">
                                            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <Brain size={16} className="text-purple-600" /> Meta Parâmetros de Ajuste Fino
                                            </h4>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Seed (Reprodutibilidade)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Ex: 12345"
                                                        value={config.aiConfig.seed || ''}
                                                        onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, seed: parseInt(e.target.value) } })}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Defina um valor para respostas consistentes.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modo JSON</label>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={config.aiConfig.jsonMode || false}
                                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, jsonMode: e.target.checked } })}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                                            <span className="ml-3 text-sm font-medium text-gray-700">Forçar saída JSON</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stop Sequences (Sequências de Parada)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: Usuário:, Fim, ###"
                                                        value={config.aiConfig.stopSequences?.join(', ') || ''}
                                                        onChange={(e) => setConfig({
                                                            ...config,
                                                            aiConfig: {
                                                                ...config.aiConfig,
                                                                stopSequences: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                                            }
                                                        })}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Separe por vírgulas. A IA parará de gerar ao encontrar esses termos.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* TAB: VECTOR CONFIG */}
                        {activeTab === 'vector' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Qdrant Connection Section */}
                                <div className="bg-gradient-to-r from-purple-50 to-primary-50 p-6 rounded-xl border border-purple-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <Database className="text-purple-600" /> Qdrant Vector Database
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {qdrantConnected ? (
                                                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                    <Check size={14} /> Conectado
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                                                    Desconectado
                                                </span>
                                            )}
                                            <button
                                                onClick={testQdrantConnection}
                                                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                Testar Conexão
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Selecionar Coleção (Knowledge Base)
                                            </label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                                                disabled={!qdrantConnected || loadingCollections}
                                                value={config.vectorConfig.knowledgeBaseId || ''}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    vectorConfig: { ...config.vectorConfig, knowledgeBaseId: e.target.value }
                                                })}
                                            >
                                                <option value="">Nenhuma coleção selecionada</option>
                                                {qdrantCollections.map((collection) => (
                                                    <option key={collection.name} value={collection.name}>
                                                        {collection.name} ({collection.pointsCount || 0} pontos)
                                                    </option>
                                                ))}
                                            </select>
                                            {loadingCollections && (
                                                <p className="text-xs text-purple-600 mt-1">Carregando coleções...</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Coleções Disponíveis
                                            </label>
                                            <div className="bg-white border rounded-lg p-3 max-h-32 overflow-y-auto">
                                                {qdrantCollections.length === 0 ? (
                                                    <p className="text-xs text-gray-500">Nenhuma coleção encontrada</p>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {qdrantCollections.map((col) => (
                                                            <div key={col.name} className="flex items-center justify-between p-2 hover:bg-purple-50 rounded">
                                                                <span className="text-sm font-medium text-gray-700">{col.name}</span>
                                                                <span className="text-xs text-gray-500">{col.pointsCount} pts</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Database className="text-green-600" /> Processamento Vetorial (RAG)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Modo de Fragmentação (Chunking)</label>
                                            <select
                                                value={config.vectorConfig.chunkingMode}
                                                onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, chunkingMode: e.target.value as 'semantic' | 'fixed' | 'hierarchical' } })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                                            >
                                                <option value="semantic">Semântico (Recomendado)</option>
                                                <option value="fixed">Tamanho Fixo</option>
                                                <option value="hierarchical">Hierárquico</option>
                                            </select>
                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check size={12} /> Otimizado para recuperação de contexto</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho Ótimo (palavras)</label>
                                            <input
                                                type="number"
                                                value={config.vectorConfig.chunkSize}
                                                onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, chunkSize: parseInt(e.target.value) } })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Recomendado: 300-500 palavras</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Estratégia de Busca</label>
                                            <select
                                                value={config.vectorConfig.searchMode || 'semantic'}
                                                onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, searchMode: e.target.value as 'semantic' | 'keyword' | 'hybrid' } })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                                            >
                                                <option value="semantic">Semântica (Vetorial)</option>
                                                <option value="keyword">Palavra-chave (BM25)</option>
                                                <option value="hybrid">Híbrida (Recomendado)</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">Híbrida combina precisão e contexto.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Reranking (Relevância)</label>
                                            <div className="flex items-center gap-2 mt-2">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={config.vectorConfig.enableReranking || false}
                                                        onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, enableReranking: e.target.checked } })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                                    <span className="ml-3 text-sm font-medium text-gray-700">Ativar Reranker (Cohere/BGE)</span>
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Reordena resultados para máxima precisão.</p>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <div className="flex justify-between mb-1">
                                            <label className="text-sm font-medium text-gray-700">Sensibilidade Semântica</label>
                                            <span className="text-sm font-bold text-gray-900">{config.vectorConfig.sensitivity}/10</span>
                                        </div>
                                        <input type="range" min="1" max="10" value={config.vectorConfig.sensitivity} className="w-full accent-green-600" />
                                        <div className="flex gap-2 mt-2">
                                            {['Conceitos', 'Definições', 'Procedimentos', 'Exemplos'].map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Filtros de Especialização</label>
                                            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                                                {[
                                                    'Escritório de Advocacia',
                                                    'Loja Física',
                                                    'E-Commerce',
                                                    'Clínica Odontológica',
                                                    'Clínica Médica',
                                                    'Clínica de Estética',
                                                    'Marketing Digital',
                                                    'Vendas B2B',
                                                    'Vendas B2C'
                                                ].map((filter, idx) => (
                                                    <label key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.vectorConfig.filters.includes(filter)}
                                                            onChange={(e) => {
                                                                const newFilters = e.target.checked
                                                                    ? [...config.vectorConfig.filters, filter]
                                                                    : config.vectorConfig.filters.filter(f => f !== filter);
                                                                setConfig({
                                                                    ...config,
                                                                    vectorConfig: {
                                                                        ...config.vectorConfig,
                                                                        filters: newFilters
                                                                    }
                                                                });
                                                            }}
                                                            className="rounded text-green-600 focus:ring-green-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{filter}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Contexto Adicional (Docs)</label>
                                                <input type="number" value={config.vectorConfig.contextWindow} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Threshold de Relevância</label>
                                                <input type="number" step="0.01" value={config.vectorConfig.relevanceThreshold} className="w-full px-3 py-2 border rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* TAB: PROMPTS */}
                        {activeTab === 'prompts' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Presets de Prompt */}
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="text-orange-600" size={20} />
                                        <div>
                                            <h4 className="text-sm font-bold text-orange-900">Templates de Prompt</h4>
                                            <p className="text-xs text-orange-700">Comece com uma base sólida de engenharia de prompt.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => applyPromptPreset('sales')} className="px-3 py-1.5 bg-white text-orange-700 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors">Vendas</button>
                                        <button onClick={() => applyPromptPreset('support')} className="px-3 py-1.5 bg-white text-orange-700 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors">Suporte</button>
                                        <button onClick={() => applyPromptPreset('legal')} className="px-3 py-1.5 bg-white text-orange-700 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors">Jurídico</button>
                                        <button onClick={() => applyPromptPreset('marketing')} className="px-3 py-1.5 bg-white text-orange-700 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors">Marketing</button>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <MessageSquare className="text-orange-500" /> Sistema de Prompts Avançado
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-1">System Prompt (Personalidade Principal)</label>
                                            <p className="text-xs text-gray-500 mb-2">Define o comportamento base e a expertise do agente.</p>
                                            <textarea
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm bg-gray-50"
                                                rows={4}
                                                value={config.prompts.system}
                                                onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, system: e.target.value } })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-800 mb-1">Prompt de Resposta Estruturada</label>
                                                <textarea
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                                                    rows={4}
                                                    value={config.prompts.responseStructure}
                                                    onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, responseStructure: e.target.value } })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-800 mb-1">Prompt de Busca Vetorial</label>
                                                <textarea
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                                                    rows={4}
                                                    value={config.prompts.vectorSearch}
                                                    onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, vectorSearch: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-800 mb-1">Prompt de Análise</label>
                                                <textarea
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                                                    rows={3}
                                                    value={config.prompts.analysis}
                                                    onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, analysis: e.target.value } })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-800 mb-1">Prompt para Casos Complexos</label>
                                                <textarea
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                                                    rows={3}
                                                    value={config.prompts.complexCases}
                                                    onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, complexCases: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-1">Prompt de Validação (Consistency Check)</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <textarea
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                                                        rows={2}
                                                        value={config.prompts.validation}
                                                        onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, validation: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="w-1/3 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                                    <div className="flex items-center gap-2 text-orange-800 font-bold text-xs mb-1">
                                                        <Shield size={12} /> Guardrails Ativos
                                                    </div>
                                                    <ul className="text-xs text-orange-700 space-y-1">
                                                        <li>• Verificar consistência</li>
                                                        <li>• Validar informações</li>
                                                        <li>• Checar alucinações</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Novo Campo: Script / Roteiro */}
                                        <div className="mt-6 border-t pt-6">
                                            <label className="block text-sm font-bold text-gray-800 mb-1">Script / Roteiro de Conversa</label>
                                            <p className="text-xs text-gray-500 mb-2">Defina um roteiro passo-a-passo ou script de vendas que o agente deve seguir.</p>
                                            <textarea
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm bg-yellow-50"
                                                rows={6}
                                                placeholder="Ex: 1. Saudação e qualificação... 2. Apresentação do produto... 3. Tratamento de objeções..."
                                                value={config.prompts.scriptContent || ''}
                                                onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, scriptContent: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* TAB: CHANNELS */}
                        {activeTab === 'channels' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Globe className="text-blue-600" /> Link Público do Agente
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between gap-4">
                                        <div className="flex-1 truncate">
                                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">URL de Acesso Eterno</span>
                                            <code className="text-sm font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded block truncate">
                                                {(config as any).slug ? `${window.location.origin}/agent/${(config as any).slug}` : 'Salve o agente para gerar o link'}
                                            </code>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                onClick={() => (config as any).slug && window.open(`/agent/${(config as any).slug}`, '_blank')}
                                                disabled={!(config as any).slug}
                                                title="Abrir página"
                                            >
                                                <ExternalLink size={20} />
                                            </button>
                                            <button
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                onClick={() => (config as any).slug && navigator.clipboard.writeText(`${window.location.origin}/agent/${(config as any).slug}`)}
                                                disabled={!(config as any).slug}
                                                title="Copiar link"
                                            >
                                                <Copy size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Smartphone className="text-green-600" /> Integração WhatsApp
                                    </h3>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={config.whatsappConfig.enabled}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    whatsappConfig: { ...config.whatsappConfig, enabled: e.target.checked }
                                                })}
                                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                            />
                                            <div>
                                                <span className="font-bold text-gray-800 block">Ativar Integração WhatsApp</span>
                                                <span className="text-sm text-gray-500">Permitir que este agente responda mensagens no WhatsApp</span>
                                            </div>
                                        </label>
                                    </div>
                                    {config.whatsappConfig.enabled && (
                                        <div className="space-y-6 animate-fade-in">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Provedor de API</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => setConfig({
                                                            ...config,
                                                            whatsappConfig: { ...config.whatsappConfig, provider: 'evolution_api' }
                                                        })}
                                                        className={`p-4 border rounded-lg text-left transition-all ${config.whatsappConfig.provider === 'evolution_api' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'hover:border-gray-300'}`}
                                                    >
                                                        <div className="font-bold text-gray-800 mb-1">Evolution API</div>
                                                        <div className="text-xs text-gray-500">API Open Source robusta para WhatsApp. Ideal para múltiplas instâncias.</div>
                                                    </button>
                                                    <button
                                                        onClick={() => setConfig({
                                                            ...config,
                                                            whatsappConfig: { ...config.whatsappConfig, provider: 'official' }
                                                        })}
                                                        className={`p-4 border rounded-lg text-left transition-all ${config.whatsappConfig.provider === 'official' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'hover:border-gray-300'}`}
                                                    >
                                                        <div className="font-bold text-gray-800 mb-1">WhatsApp Cloud API (Meta)</div>
                                                        <div className="text-xs text-gray-500">API Oficial da Meta. Alta estabilidade, mas requer verificação de negócio.</div>
                                                    </button>
                                                </div>
                                            </div>
                                            {config.whatsappConfig.provider === 'evolution_api' && (
                                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Configuração Evolution API</h4>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                                                            <input
                                                                type="text"
                                                                placeholder="https://api.seu-dominio.com"
                                                                value={config.whatsappConfig.evolution.baseUrl}
                                                                onChange={(e) => setConfig({
                                                                    ...config,
                                                                    whatsappConfig: {
                                                                        ...config.whatsappConfig,
                                                                        evolution: { ...config.whatsappConfig.evolution, baseUrl: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Global)</label>
                                                            <input
                                                                type="password"
                                                                value={config.whatsappConfig.evolution.apiKey}
                                                                onChange={(e) => setConfig({
                                                                    ...config,
                                                                    whatsappConfig: {
                                                                        ...config.whatsappConfig,
                                                                        evolution: { ...config.whatsappConfig.evolution, apiKey: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Instância</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Ex: atendimento_juridico"
                                                                value={config.whatsappConfig.evolution.instanceName}
                                                                onChange={(e) => setConfig({
                                                                    ...config,
                                                                    whatsappConfig: {
                                                                        ...config.whatsappConfig,
                                                                        evolution: { ...config.whatsappConfig.evolution, instanceName: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {config.whatsappConfig.provider === 'official' && (
                                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Configuração WhatsApp Cloud API</h4>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
                                                            <input
                                                                type="text"
                                                                value={config.whatsappConfig.official.phoneNumberId}
                                                                onChange={(e) => setConfig({
                                                                    ...config,
                                                                    whatsappConfig: {
                                                                        ...config.whatsappConfig,
                                                                        official: { ...config.whatsappConfig.official, phoneNumberId: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                                                            <input
                                                                type="password"
                                                                value={config.whatsappConfig.official.accessToken}
                                                                onChange={(e) => setConfig({
                                                                    ...config,
                                                                    whatsappConfig: {
                                                                        ...config.whatsappConfig,
                                                                        official: { ...config.whatsappConfig.official, accessToken: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Verify Token (Webhook)</label>
                                                            <input
                                                                type="text"
                                                                value={config.whatsappConfig.official.verifyToken}
                                                                onChange={(e) => setConfig({
                                                                    ...config,
                                                                    whatsappConfig: {
                                                                        ...config.whatsappConfig,
                                                                        official: { ...config.whatsappConfig.official, verifyToken: e.target.value }
                                                                    }
                                                                })}
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={handleTestConnection}
                                                    disabled={testConnectionMutation.isPending}
                                                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${testConnectionMutation.isPending ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                >
                                                    {testConnectionMutation.isPending ? (
                                                        <>Testando...</>
                                                    ) : (
                                                        <>Testar Conexão</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* TAB: ADVANCED */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Chunking Otimizado */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Database className="text-primary-600" /> Configuração de Fragmentação (Chunking)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Estratégia</label>
                                            <select
                                                value={config.vectorConfig.chunkingStrategy}
                                                onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, chunkingStrategy: e.target.value as 'paragraph' | 'fixed' | 'semantic' } })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            >
                                                <option value="paragraph">Parágrafo (Recomendado)</option>
                                                <option value="fixed">Fixo</option>
                                                <option value="semantic">Semântico</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">Parágrafo oferece melhor precisão para textos jurídicos.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Delimitador</label>
                                            <input
                                                type="text"
                                                value={config.vectorConfig.chunkDelimiter}
                                                onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, chunkDelimiter: e.target.value } })}
                                                className="w-full px-3 py-2 border rounded-lg font-mono"
                                                placeholder="\n\n"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho Máximo (chars)</label>
                                            <input
                                                type="number"
                                                value={config.vectorConfig.maxChunkSize}
                                                onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, maxChunkSize: parseInt(e.target.value) } })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">2048 = Equilíbrio contexto/performance.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sobreposição (chars)</label>
                                            <input
                                                type="number"
                                                value={config.vectorConfig.chunkOverlap ?? 100}
                                                onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, chunkOverlap: parseInt(e.target.value) } })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">100 = Preserva continuidade contextual.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Inteligência Avançada */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Brain className="text-purple-600" /> Inteligência Avançada
                                    </h3>
                                    <div className="space-y-6">
                                        {/* Embeddings Híbridos */}
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700 mb-2">Embeddings Híbridos</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Precisão Semântica ({config.vectorConfig.hybridConfig?.semanticPrecision})</label>
                                                    <input
                                                        type="range" min="0" max="1" step="0.05"
                                                        value={config.vectorConfig.hybridConfig?.semanticPrecision ?? 0.85}
                                                        onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, hybridConfig: { ...(config.vectorConfig.hybridConfig || { semanticPrecision: 0.85, contextualWeight: 0.25 }), semanticPrecision: parseFloat(e.target.value) } } })}
                                                        className="w-full accent-purple-600"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Peso Contextual ({config.vectorConfig.hybridConfig?.contextualWeight ?? 0.25})</label>
                                                    <input
                                                        type="range" min="0" max="1" step="0.05"
                                                        value={config.vectorConfig.hybridConfig?.contextualWeight ?? 0.25}
                                                        onChange={(e) => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, hybridConfig: { ...(config.vectorConfig.hybridConfig || { semanticPrecision: 0.85, contextualWeight: 0.25 }), contextualWeight: parseFloat(e.target.value) } } })}
                                                        className="w-full accent-purple-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Validação Multi-Modelo */}
                                        <div className="border-t pt-4">
                                            <h4 className="text-sm font-bold text-gray-700 mb-2">Validação Multi-Modelo</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Consenso Mínimo ({config.advancedConfig?.multiModelValidation.minConsensus ?? 0.75})</label>
                                                    <input
                                                        type="range" min="0.5" max="1" step="0.05"
                                                        value={config.advancedConfig?.multiModelValidation.minConsensus ?? 0.75}
                                                        onChange={(e) => setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), multiModelValidation: { ...(config.advancedConfig?.multiModelValidation || INITIAL_CONFIG.advancedConfig!.multiModelValidation), minConsensus: parseFloat(e.target.value) } } })}
                                                        className="w-full accent-primary-600"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Modelos Paralelos</label>
                                                    <input
                                                        type="number" min="1" max="5"
                                                        value={config.advancedConfig?.multiModelValidation.parallelModels ?? 3}
                                                        onChange={(e) => setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), multiModelValidation: { ...(config.advancedConfig?.multiModelValidation || INITIAL_CONFIG.advancedConfig!.multiModelValidation), parallelModels: parseInt(e.target.value) } } })}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Qualidade e Segurança */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Shield className="text-green-600" /> Qualidade e Segurança
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Verificação de Alucinações (Sensibilidade)</label>
                                            <input
                                                type="range" min="0" max="1" step="0.05"
                                                value={config.advancedConfig?.qualitySafety.hallucinationCheck.sensitivity ?? 0.8}
                                                onChange={(e) => setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), qualitySafety: { ...(config.advancedConfig?.qualitySafety || INITIAL_CONFIG.advancedConfig!.qualitySafety), hallucinationCheck: { ...(config.advancedConfig?.qualitySafety.hallucinationCheck || INITIAL_CONFIG.advancedConfig!.qualitySafety.hallucinationCheck), sensitivity: parseFloat(e.target.value) } } } })}
                                                className="w-full accent-green-600"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Valor atual: {config.advancedConfig?.qualitySafety.hallucinationCheck.sensitivity ?? 0.8}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cache Semântico (Similaridade)</label>
                                            <input
                                                type="range" min="0.5" max="1" step="0.01"
                                                value={config.advancedConfig?.qualitySafety.semanticCache.similarityThreshold ?? 0.9}
                                                onChange={(e) => setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), qualitySafety: { ...(config.advancedConfig?.qualitySafety || INITIAL_CONFIG.advancedConfig!.qualitySafety), semanticCache: { ...(config.advancedConfig?.qualitySafety.semanticCache || INITIAL_CONFIG.advancedConfig!.qualitySafety.semanticCache), similarityThreshold: parseFloat(e.target.value) } } } })}
                                                className="w-full accent-green-600"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Valor atual: {config.advancedConfig?.qualitySafety.semanticCache.similarityThreshold}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* KPIs e Metas */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Zap className="text-yellow-500" /> KPIs e Metas do Agente
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">Defina os objetivos que o agente deve perseguir (ex: agendar reunião, capturar email).</p>

                                    <div className="space-y-3">
                                        {config.advancedConfig?.kpis?.map((kpi, index) => (
                                            <div key={index} className="flex gap-2 items-start">
                                                <input
                                                    type="text"
                                                    placeholder="Nome do KPI (ex: Taxa de Conversão)"
                                                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                                    value={kpi.name}
                                                    onChange={(e) => {
                                                        const newKpis = [...(config.advancedConfig?.kpis || [])];
                                                        newKpis[index] = { ...newKpis[index], name: e.target.value };
                                                        setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), kpis: newKpis } });
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Meta (ex: 10%)"
                                                    className="w-24 px-3 py-2 border rounded-lg text-sm"
                                                    value={kpi.target}
                                                    onChange={(e) => {
                                                        const newKpis = [...(config.advancedConfig?.kpis || [])];
                                                        newKpis[index] = { ...newKpis[index], target: e.target.value };
                                                        setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), kpis: newKpis } });
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newKpis = config.advancedConfig?.kpis?.filter((_, i) => i !== index);
                                                        setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), kpis: newKpis || [] } });
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => {
                                                const newKpis = [...(config.advancedConfig?.kpis || []), { name: '', target: '' }];
                                                setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), kpis: newKpis } });
                                            }}
                                            className="text-sm text-primary-600 font-medium hover:text-blue-800 flex items-center gap-1"
                                        >
                                            + Adicionar KPI
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* TAB: DEPLOY */}
                        {activeTab === 'deploy' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <LayoutTemplate className="text-primary-600" /> Widget & Deploy
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Incorpore seu agente em qualquer site usando o código abaixo.
                                    </p>

                                    <div className="bg-gray-900 rounded-lg p-4 relative group">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    const code = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['AgentWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','mw','${window.location.origin}/widget.js'));
  
  mw('init', { 
    agentId: '${config.identity.name || 'AGENT_ID'}',
    primaryColor: '#2563EB'
  });
<\/script>`;
                                                    navigator.clipboard.writeText(code);
                                                    alert('Código copiado!');
                                                }}
                                                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur-sm"
                                            >
                                                Copiar Código
                                            </button>
                                        </div>
                                        <code className="text-green-400 font-mono text-sm block whitespace-pre-wrap">
                                            {`<script>
  (function(w,d,s,o,f,js,fjs){
    w['AgentWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','mw','${window.location.origin}/widget.js'));
  
  mw('init', { 
    agentId: '${config.identity.name || 'AGENT_ID'}',
    primaryColor: '#2563EB'
  });
<\/script>`}
                                        </code>
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                                            <h4 className="font-bold text-blue-800 mb-2">1. Copie o Código</h4>
                                            <p className="text-sm text-primary-600">Copie o snippet acima e substitua 'SEU_AGENT_ID_AQUI' pelo ID do seu agente após salvar.</p>
                                        </div>
                                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                            <h4 className="font-bold text-purple-800 mb-2">2. Cole no Site</h4>
                                            <p className="text-sm text-purple-600">Cole o código antes da tag &lt;/body&gt; em todas as páginas onde deseja que o chat apareça.</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                            <h4 className="font-bold text-green-800 mb-2">3. Personalize</h4>
                                            <p className="text-sm text-green-600">Você pode passar parâmetros adicionais como 'primaryColor' para ajustar a aparência.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Salvar Template */}
            {
                showSaveTemplateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Save className="text-purple-600" /> Salvar como Template
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Template</label>
                                    <input
                                        type="text"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        placeholder="Ex: Bot Imobiliária Premium"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <textarea
                                        value={templateDescription}
                                        onChange={(e) => setTemplateDescription(e.target.value)}
                                        placeholder="Descreva o propósito deste template..."
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setShowSaveTemplateModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveTemplate}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                                    >
                                        Salvar Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal Configuração Mágica */}
            {
                showMagicModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Wand2 className="text-indigo-600" /> Configuração Mágica de IA
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Descreva o agente que você deseja criar e nossa IA irá gerar a configuração perfeita (identidade, prompts e parâmetros) para você.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Agente</label>
                                    <textarea
                                        value={magicDescription}
                                        onChange={(e) => setMagicDescription(e.target.value)}
                                        placeholder="Ex: Um especialista em vendas de imóveis de luxo que seja persuasivo, educado e focado em agendar visitas. Ele deve saber lidar com objeções de preço."
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setShowMagicModal(false)}
                                        disabled={isGeneratingConfig}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleMagicConfig}
                                        disabled={isGeneratingConfig || !magicDescription}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                                    >
                                        {isGeneratingConfig ? (
                                            <><Loader2 className="animate-spin" size={18} /> Gerando Mágica...</>
                                        ) : (
                                            <><Wand2 size={18} /> Gerar Configuração</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal Carregar Template */}
            {
                showLoadTemplateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-2xl animate-fade-in max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <LayoutTemplate className="text-primary-600" /> Carregar Template
                                </h3>
                                <button onClick={() => setShowLoadTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                            {!loadingTemplates && availableTemplates.length > 0 && (
                                <div className="mb-4 flex justify-end">
                                    <button
                                        onClick={handleSetupTemplates}
                                        className="text-xs text-primary-600 hover:text-blue-800 flex items-center gap-1 bg-primary-50 px-2 py-1 rounded hover:bg-primary-100 transition-colors"
                                        title="Recarregar templates do sistema"
                                    >
                                        <RefreshCw size={12} /> Atualizar Lista
                                    </button>
                                </div>
                            )}
                            {loadingTemplates ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-primary-600" size={32} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {availableTemplates.map(template => (
                                        <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group" onClick={() => handleSelectTemplate(template.template_id)}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-800 group-hover:text-primary-700">{template.template_name}</h4>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{template.category}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-2">{template.template_description || 'Sem descrição.'}</p>
                                        </div>
                                    ))}
                                    {availableTemplates.length === 0 && (
                                        <div className="col-span-full text-center py-8 text-gray-400 flex flex-col items-center gap-4">
                                            <p>Nenhum template encontrado.</p>
                                            {showSetupButton && (
                                                <button
                                                    onClick={handleSetupTemplates}
                                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                                                >
                                                    <Database size={18} /> Inicializar Templates Padrão
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

        </div >
    );
};
