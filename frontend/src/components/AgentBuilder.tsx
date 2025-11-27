import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
    Brain, Save, Database, MessageSquare,
    Shield, Fingerprint, Wand2, Smartphone, Check,
    LayoutTemplate, X, Loader2, RefreshCw
} from 'lucide-react';
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
    };
    prompts: {
        system: string;
        responseStructure: string;
        vectorSearch: string;
        analysis: string;
        complexCases: string;
        validation: string;
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
        knowledgeBaseId: ''
    },
    prompts: {
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
    const [activeTab, setActiveTab] = useState<'identity' | 'ai' | 'vector' | 'prompts' | 'channels'>('identity');
    const [config, setConfig] = useState<AgentConfig>(INITIAL_CONFIG);

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
                body: JSON.stringify(agentConfig)
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
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates/${templateId}`);
                    const data = await response.json();
                    if (data.base_config) {
                        setConfig(data.base_config);
                        // Opcional: Mostrar notificação de sucesso
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates`, {
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates`);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates/setup-db`, {
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates/${templateId}`);
            const data = await response.json();
            if (data.base_config) {
                setConfig(data.base_config);
                setShowLoadTemplateModal(false);
                alert('Template carregado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao carregar template:', error);
            alert('Erro ao carregar o template selecionado.');
        }
    };
    return (
        <div className="flex flex-col h-full bg-gray-50 animate-fade-in min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-800">Construtor de Agentes IA</h2>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase">Enterprise Edition</span>
                    </div>
                    <p className="text-sm text-gray-500">Configure agentes especializados com parâmetros avançados de RAG e Engenharia de Prompt.</p>
                </div>
                <div className="flex gap-3">
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
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium flex items-center gap-2 border border-blue-200"
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
                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 ${saveAgentMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <Save size={18} /> {saveAgentMutation.isPending ? 'Salvando...' : 'Salvar Agente'}
                    </button>
                </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                    <nav className="p-4 space-y-1">
                        <button
                            onClick={() => setActiveTab('identity')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'identity' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Fingerprint size={18} /> Identidade & Perfil
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Brain size={18} /> Parâmetros de IA
                        </button>
                        <button
                            onClick={() => setActiveTab('vector')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'vector' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Database size={18} /> Base Vetorial (RAG)
                        </button>
                        <button
                            onClick={() => setActiveTab('prompts')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'prompts' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <MessageSquare size={18} /> Engenharia de Prompt
                        </button>
                        <button
                            onClick={() => setActiveTab('channels')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'channels' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Smartphone size={18} /> Canais & Integrações
                        </button>
                    </nav>

                </div>
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* TAB: IDENTIDADE */}
                        {activeTab === 'identity' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Fingerprint className="text-blue-500" /> Identidade do Agente
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Agente</label>
                                            <input type="text" value={config.identity.name} onChange={(e) => setConfig({ ...config, identity: { ...config.identity, name: e.target.value } })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Jurídica</label>
                                            <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                                <option value="service">Atendimento ao Cliente</option>
                                                <option value="sales">Vendas & Comercial</option>
                                                <option value="specialist">Especialista Técnico</option>
                                                <option value="assistant">Assistente Geral</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Agente</label>
                                            <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} value={config.identity.description} onChange={(e) => setConfig({ ...config, identity: { ...config.identity, description: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Classe do Agente</label>
                                            <select
                                                value={config.identity.class}
                                                onChange={(e) => setConfig({ ...config, identity: { ...config.identity, class: e.target.value } })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Especialização</label>
                                            <div className="flex items-center gap-4">
                                                <input
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
                                                <span className="font-bold text-blue-600">
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
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                                            <p className="text-xs text-gray-500 mt-1">0 = Determin��stico, 2 = Muito Criativo</p>
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
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200 shadow-sm">
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
                                            <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 bg-white">
                                                <option value="semantic">Semântico (Recomendado)</option>
                                                <option value="fixed">Tamanho Fixo</option>
                                                <option value="hierarchical">Hierárquico</option>
                                            </select>
                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check size={12} /> Otimizado para recuperação de contexto</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho Ótimo (palavras)</label>
                                            <input type="number" value={config.vectorConfig.chunkSize} className="w-full px-3 py-2 border rounded-lg" />
                                            <p className="text-xs text-gray-500 mt-1">Recomendado: 300-500 palavras</p>
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
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <MessageSquare className="text-orange-500" /> Sistema de Prompts Avançado
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-1">System Prompt (Personalidade Principal)</label>
                                            <p className="text-xs text-gray-500 mb-2">Define o comportamento base e a expertise do agente.</p>
                                            <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm bg-gray-50" rows={4} value={config.prompts.system} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-800 mb-1">Prompt de Resposta Estruturada</label>
                                                <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm" rows={4} value={config.prompts.responseStructure} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-800 mb-1">Prompt de Busca Vetorial</label>
                                                <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm" rows={4} value={config.prompts.vectorSearch} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-800 mb-1">Prompt de Análise</label>
                                                <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm" rows={3} value={config.prompts.analysis} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-800 mb-1">Prompt para Casos Complexos</label>
                                                <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm" rows={3} value={config.prompts.complexCases} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-1">Prompt de Validação (Consistency Check)</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm" rows={2} value={config.prompts.validation} />
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
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* TAB: CHANNELS */}
                        {activeTab === 'channels' && (
                            <div className="space-y-6 animate-fade-in">
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
                                                        className={`p-4 border rounded-lg text-left transition-all ${config.whatsappConfig.provider === 'official' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-gray-300'}`}
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
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    </div>
                </div>
            </div>
            {/* Modal Salvar Template */}
            {showSaveTemplateModal && (
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
            )}
            {/* Modal Configuração Mágica */}
            {showMagicModal && (
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
                                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 ${isGeneratingConfig ? 'opacity-70 cursor-not-allowed' : ''}`}
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
            )}
            {/* Modal Carregar Template */}
            {showLoadTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-2xl animate-fade-in max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <LayoutTemplate className="text-blue-600" /> Carregar Template
                            </h3>
                            <button onClick={() => setShowLoadTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        {!loadingTemplates && availableTemplates.length > 0 && (
                            <div className="mb-4 flex justify-end">
                                <button
                                    onClick={handleSetupTemplates}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                    title="Recarregar templates do sistema"
                                >
                                    <RefreshCw size={12} /> Atualizar Lista
                                </button>
                            </div>
                        )}
                        {loadingTemplates ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableTemplates.map(template => (
                                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group" onClick={() => handleSelectTemplate(template.template_id)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-800 group-hover:text-blue-700">{template.template_name}</h4>
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
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
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
            )}
        </div>
    );
};