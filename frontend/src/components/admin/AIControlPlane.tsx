import React, { useState, useEffect } from 'react';
import { Bot, Save, Database, Sparkles, MessageSquare, RefreshCw, Sliders, FileText, Cpu, Brain, Zap, Plus, Trash2, ArrowLeft } from "lucide-react";
import { apiClient } from '@/services/apiClient';
import { useNavigate } from 'react-router-dom';

// --- Types ---
interface Agent {
    id: number;
    slug: string;
    name: string;
    description: string;
    category: string;
    client_id?: number | null;
    status: string;
    is_system?: boolean;
}

interface AgentConfig {
    basic: {
        name: string;
        description: string;
        category: string;
        level: number;
        active: boolean;
        class: string;
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
    };
    vectorProcessing: {
        chunkingMode: string;
        chunkSize: number;
        structureSensitivity: number;
        minRelevance: number;
        conceptWeight: number;
        autoFineTuning: boolean;
        embeddingModel: string;
    };
    prompts: {
        system: string;
        vectorSearch: string;
        analysis: string;
        responseStructure: string;
        complexCases: string;
        validation: string;
    };
    capabilities: string[];
    whatsappConfig?: any;
    advancedConfig?: any;
}


// --- Components UI (Light Theme) ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>{children}</div>
);

const Button = ({ onClick, children, disabled = false, variant = "primary", className = "" }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean; variant?: "primary" | "outline" | "ghost" | "danger"; className?: string }) => {
    const baseClass = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2";
    const variants = {
        primary: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
        ghost: "hover:bg-gray-100 text-gray-600",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClass} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 ${props.className || ''}`} />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 ${props.className || ''}`} />
);

const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 ${className}`}>{children}</label>
);

const Select = ({ value, onChange, options }: { value: string; onChange: (val: string) => void; options: { label: string; value: string }[] }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 appearance-none"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </div>
);

const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-purple-600' : 'bg-gray-200'
            }`}
    >
        <span
            data-state={checked ? 'checked' : 'unchecked'}
            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                }`}
        />
    </button>
);


const AIControlPlane = () => {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'prompts' | 'technical' | 'vector' | 'capabilities'>('info');
    const [vectorTab, setVectorTab] = useState<'chunking' | 'quality' | 'finetuning' | 'embeddings'>('chunking');

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            // Fetch ALL agents including System Agents using the new query param
            const res = await apiClient.get('/agents?include_system=true');
            const allAgents = res.data;
            // Filter to show primarily System Agents or sort them to top
            // For this Admin view, we might want to see ONLY system agents or distinct them clearly
            // Let's keep all but prioritize system agents in UI
            setAgents(allAgents);
        } catch (err) {
            console.error("Failed to load agents", err);
        }
    };

    const loadAgentConfig = async (agentId: number) => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/agents/${agentId}`);
            const data = res.data;

            // Extract capabilities from specialized storage or default
            const capabilities = data.advancedConfig?.capabilities || data.aiConfig?.capabilities || ['Análise de documentos', 'Geração de insights'];

            setConfig({
                basic: {
                    name: data.identity?.name || data.name,
                    description: data.identity?.description || data.description,
                    category: data.identity?.category || data.category,
                    class: data.identity?.class || 'SystemAgent',
                    level: data.identity?.specializationLevel || 3,
                    active: data.identity?.status === 'active'
                },
                aiConfig: {
                    model: data.aiConfig?.model || 'gpt-4o',
                    temperature: data.aiConfig?.temperature || 0.7,
                    provider: data.aiConfig?.provider || 'openai',
                    topP: data.aiConfig?.topP || 0.95,
                    topK: data.aiConfig?.topK || 10,
                    maxTokens: data.aiConfig?.maxTokens || 2000,
                    timeout: data.aiConfig?.timeout || 60,
                    retries: data.aiConfig?.retries || 3
                },
                vectorProcessing: {
                    chunkingMode: data.vectorConfig?.chunkingMode || 'semantico',
                    chunkSize: data.vectorConfig?.chunkSize || 275,
                    structureSensitivity: data.vectorConfig?.sensitivity || 7,
                    minRelevance: data.vectorConfig?.relevanceThreshold || 0.8,
                    conceptWeight: 70, // Not present in backend explicitly yet, keep default
                    autoFineTuning: true, // Not present in backend explicitly yet, keep default
                    embeddingModel: 'text-embedding-3-small' // Not present in backend explicitly yet, keep default
                },
                prompts: {
                    system: data.prompts?.system || '',
                    analysis: data.prompts?.analysis || '',
                    responseStructure: data.prompts?.responseStructure || '',
                    vectorSearch: data.prompts?.vectorSearch || '',
                    complexCases: data.prompts?.complexCases || '',
                    validation: data.prompts?.validation || ''
                },
                capabilities: capabilities,
                whatsappConfig: data.whatsappConfig || {},
                advancedConfig: data.advancedConfig || {}
            });
        } catch (err) {
            console.error("Failed to load agent config", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAgentSelect = (agent: Agent) => {
        setSelectedAgent(agent);
        loadAgentConfig(agent.id);
    };

    const handleSave = async () => {
        if (!selectedAgent || !config) return;
        setIsSaving(true);
        try {
            const updatedAdvancedConfig = {
                ...config.advancedConfig,
                capabilities: config.capabilities
            };

            const payload = {
                identity: {
                    name: config.basic.name,
                    description: config.basic.description,
                    category: config.basic.category,
                    class: config.basic.class,
                    specializationLevel: config.basic.level,
                    status: config.basic.active ? 'active' : 'inactive',
                    clientId: selectedAgent.client_id
                },
                aiConfig: {
                    ...config.aiConfig,
                    responseMode: 'balanced',
                    candidateCount: 1,
                    jsonMode: false
                },
                vectorConfig: {
                    chunkingMode: config.vectorProcessing.chunkingMode,
                    chunkSize: config.vectorProcessing.chunkSize,
                    sensitivity: config.vectorProcessing.structureSensitivity,
                    contextWindow: 10,
                    relevanceThreshold: config.vectorProcessing.minRelevance,
                    searchMode: 'semantic',
                    enableReranking: false,
                    chunkingStrategy: 'paragraph',
                    chunkDelimiter: '\n\n',
                    maxChunkSize: 2048,
                    chunkOverlap: 100
                },
                prompts: config.prompts,
                whatsappConfig: config.whatsappConfig,
                advancedConfig: updatedAdvancedConfig
            };

            await apiClient.put(`/agents/${selectedAgent.id}`, payload);
            await loadAgentConfig(selectedAgent.id);
            setAgents(prev => prev.map(a =>
                a.id === selectedAgent.id ? { ...a, name: config.basic.name, description: config.basic.description, category: config.basic.category } : a
            ));
            alert("Configuração salva com sucesso!");
        } catch (err) {
            console.error("Failed to save", err);
            alert("Erro ao salvar configuração.");
        } finally {
            setIsSaving(false);
        }
    };

    const addCapability = () => {
        if (config) {
            setConfig({ ...config, capabilities: [...config.capabilities, 'Nova Capacidade'] });
        }
    };

    const removeCapability = (index: number) => {
        if (config) {
            const newCaps = [...config.capabilities];
            newCaps.splice(index, 1);
            setConfig({ ...config, capabilities: newCaps });
        }
    };

    const updateCapability = (index: number, val: string) => {
        if (config) {
            const newCaps = [...config.capabilities];
            newCaps[index] = val;
            setConfig({ ...config, capabilities: newCaps });
        }
    };

    // Filter to show only System Agents in the sidebar list (since this is Admin Control Plane)
    // Or highlight them. Reverting to simple list for now but filtered by the backend returns.
    const systemAgents = agents.filter(a => a.is_system);

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-700">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Bot className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">AI Control Plane</h1>
                                    <p className="text-xs text-gray-500">Gestão Avançada de Agentes do Sistema</p>
                                </div>
                            </div>
                        </div>
                        <Button onClick={fetchAgents} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" /> Atualizar Lista
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Sidebar: System Agent List */}
                    <div className="md:col-span-3">
                        <Card className="h-full min-h-[600px] flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-500" /> Agentes de Elite
                                </h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {systemAgents.length === 0 && (
                                    <p className="p-4 text-sm text-gray-400 text-center">Nenhum agente de sistema encontrado.</p>
                                )}
                                {systemAgents.map((agent) => (
                                    <div
                                        key={agent.id}
                                        onClick={() => handleAgentSelect(agent)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedAgent?.id === agent.id
                                            ? 'bg-purple-50 border-purple-200 shadow-sm'
                                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedAgent?.id === agent.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {agent.slug.includes('sales') ? <Sparkles className="h-4 w-4" /> :
                                                    agent.slug.includes('creative') ? <Bot className="h-4 w-4" /> :
                                                        <Brain className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-medium text-sm truncate ${selectedAgent?.id === agent.id ? 'text-purple-900' : 'text-gray-700'}`}>
                                                    {agent.name}
                                                </div>
                                                <div className="text-xs text-gray-400 truncate">{agent.category}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-9">
                        <Card className="min-h-[600px] flex flex-col overflow-hidden">
                            {isLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <RefreshCw className="h-10 w-10 animate-spin mb-3 text-purple-500" />
                                    <p>Carregando configurações...</p>
                                </div>
                            ) : selectedAgent && config ? (
                                <>
                                    <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm bg-white/90">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{config.basic.name}</h2>
                                            <div className="flex gap-3 text-xs">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">ID: {selectedAgent.id}</span>
                                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">{config.aiConfig.model}</span>
                                            </div>
                                        </div>
                                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                                            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                        </Button>
                                    </div>

                                    <div className="border-b border-gray-200 px-6">
                                        <div className="flex space-x-6 overflow-x-auto">
                                            {[
                                                { id: 'info', label: 'Básico', icon: Bot },
                                                { id: 'technical', label: 'Parâmetros IA', icon: Sliders },
                                                { id: 'vector', label: 'Processamento Vetorial', icon: Database },
                                                { id: 'prompts', label: 'Engenharia de Prompt', icon: FileText },
                                                { id: 'capabilities', label: 'Habilidades', icon: Zap }
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id as any)}
                                                    className={`py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                                                        ? 'border-purple-600 text-purple-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <tab.icon className="h-4 w-4" />
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 bg-gray-50/50">
                                        {/* TAB: BASIC INFO */}
                                        {activeTab === 'info' && (
                                            <div className="space-y-6 max-w-3xl animate-fade-in">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Nome do Agente</Label>
                                                            <Input
                                                                value={config.basic.name}
                                                                onChange={(e) => setConfig({ ...config, basic: { ...config.basic, name: e.target.value } })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Categoria</Label>
                                                            <Input
                                                                value={config.basic.category}
                                                                onChange={(e) => setConfig({ ...config, basic: { ...config.basic, category: e.target.value } })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Descrição</Label>
                                                            <Textarea
                                                                value={config.basic.description}
                                                                onChange={(e) => setConfig({ ...config, basic: { ...config.basic, description: e.target.value } })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Classe do Agente</Label>
                                                            <Input value={config.basic.class} readOnly className="bg-gray-100 text-gray-500" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Nível de Especialização</Label>
                                                            <Select
                                                                value={config.basic.level.toString()}
                                                                options={[
                                                                    { label: '1 - Iniciante', value: '1' },
                                                                    { label: '2 - Intermediário', value: '2' },
                                                                    { label: '3 - Avançado', value: '3' },
                                                                    { label: '4 - Especialista', value: '4' },
                                                                    { label: '5 - Mestre', value: '5' }
                                                                ]}
                                                                onChange={(v) => setConfig({ ...config, basic: { ...config.basic, level: parseInt(v) } })}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 mt-6 shadow-sm">
                                                            <div>
                                                                <Label className="text-gray-900">Status do Agente</Label>
                                                                <p className="text-xs text-gray-500">Agentes ativos podem ser invocados</p>
                                                            </div>
                                                            <Switch
                                                                checked={config.basic.active}
                                                                onCheckedChange={(c) => setConfig({ ...config, basic: { ...config.basic, active: c } })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm mt-6">
                                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Cpu className="h-4 w-4 text-purple-500" /> Configuração de LLM
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <Label className="mb-2 block">Provedor de IA</Label>
                                                            <Select
                                                                value={config.aiConfig.provider}
                                                                options={[
                                                                    { label: 'OpenAI', value: 'openai' },
                                                                    { label: 'Anthropic', value: 'anthropic' },
                                                                    { label: 'Google', value: 'google' }
                                                                ]}
                                                                onChange={(v) => setConfig({ ...config, aiConfig: { ...config.aiConfig, provider: v } })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2 block">Modelo</Label>
                                                            <Input
                                                                value={config.aiConfig.model}
                                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, model: e.target.value } })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: TECHNICAL PARAMETERS */}
                                        {activeTab === 'technical' && (
                                            <div className="space-y-6 max-w-3xl animate-fade-in">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-6 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between">
                                                                <Label>Temperature</Label>
                                                                <span className="text-xs font-mono bg-gray-100 px-2 rounded">{config.aiConfig.temperature}</span>
                                                            </div>
                                                            <input
                                                                type="range" min="0" max="2" step="0.1"
                                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                                value={config.aiConfig.temperature}
                                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, temperature: parseFloat(e.target.value) } })}
                                                            />
                                                            <p className="text-xs text-gray-500">Controla a criatividade/alucinação (0=Preciso, 2=Criativo)</p>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex justify-between">
                                                                <Label>Top-P</Label>
                                                                <span className="text-xs font-mono bg-gray-100 px-2 rounded">{config.aiConfig.topP}</span>
                                                            </div>
                                                            <input
                                                                type="range" min="0" max="1" step="0.05"
                                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                                value={config.aiConfig.topP}
                                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, topP: parseFloat(e.target.value) } })}
                                                            />
                                                            <p className="text-xs text-gray-500">Diversidade de vocabulário (Nucleus Sampling)</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Top-K</Label>
                                                            <Input
                                                                type="number"
                                                                value={config.aiConfig.topK}
                                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, topK: parseInt(e.target.value) } })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Max Tokens</Label>
                                                            <Input
                                                                type="number"
                                                                value={config.aiConfig.maxTokens}
                                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, maxTokens: parseInt(e.target.value) } })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Timeout (ms)</Label>
                                                            <Input
                                                                type="number"
                                                                value={config.aiConfig.timeout}
                                                                onChange={(e) => setConfig({ ...config, aiConfig: { ...config.aiConfig, timeout: parseInt(e.target.value) } })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: PROMPTS */}
                                        {activeTab === 'prompts' && (
                                            <div className="space-y-6 max-w-4xl animate-fade-in">
                                                <div className="space-y-2">
                                                    <Label className="text-purple-700">System Prompt (Personalidade Central)</Label>
                                                    <Textarea
                                                        className="min-h-[250px] font-mono text-sm bg-gray-50 border-gray-300 focus:bg-white focus:ring-purple-500"
                                                        value={config.prompts.system}
                                                        onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, system: e.target.value } })}
                                                        placeholder="Defina quem é o agente, suas restrições e objetivos..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label>Prompt de Análise</Label>
                                                        <Textarea
                                                            className="min-h-[120px] font-mono text-sm"
                                                            value={config.prompts.analysis}
                                                            onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, analysis: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Estrutura de Resposta</Label>
                                                        <Textarea
                                                            className="min-h-[120px] font-mono text-sm"
                                                            value={config.prompts.responseStructure}
                                                            onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, responseStructure: e.target.value } })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: CAPABILITIES */}
                                        {activeTab === 'capabilities' && (
                                            <div className="space-y-6 max-w-2xl animate-fade-in">
                                                <div className="flex justify-between items-center mb-4">
                                                    <Label>Habilidades Definidas</Label>
                                                    <Button onClick={addCapability} variant="outline" className="text-xs h-8">
                                                        <Plus className="h-3 w-3 mr-1" /> Adicionar
                                                    </Button>
                                                </div>

                                                <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                    {config.capabilities.map((cap, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <Input
                                                                value={cap}
                                                                onChange={(e) => updateCapability(idx, e.target.value)}
                                                                placeholder="Ex: Análise de Contratos"
                                                            />
                                                            <Button onClick={() => removeCapability(idx)} variant="danger" className="px-3 h-10 w-10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {config.capabilities.length === 0 && (
                                                        <p className="text-gray-400 text-center italic text-sm py-4">Nenhuma habilidade extra definida.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Placeholder for other tabs */}
                                        {activeTab === 'vector' && (
                                            <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-300">
                                                <Database className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500">Configuração Vetorial Avançada</p>
                                                <p className="text-xs text-gray-400 mt-2">Utilize as opções padrão ou personalize no banco de dados.</p>
                                            </div>
                                        )}

                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50">
                                    <div className="h-24 w-24 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm">
                                        <Bot className="h-10 w-10 text-purple-300" />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900">Selecione um Agente do Sistema</h3>
                                    <p className="max-w-md mx-auto mt-2 text-gray-500">
                                        Escolha um dos agentes na barra lateral para configurar sua inteligência, prompts e parâmetros técnicos.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIControlPlane;
