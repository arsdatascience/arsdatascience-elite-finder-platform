import React, { useState, useEffect } from 'react';
import { Bot, Save, Database, Sparkles, MessageSquare, RefreshCw, Sliders, FileText, Cpu, Brain, Zap, Plus, Trash2 } from "lucide-react";
import { apiClient } from '@/services/apiClient';

// --- Types ---
interface Agent {
    id: number;
    slug: string;
    name: string;
    description: string;
    category: string;
    client_id?: number;
    status: string;
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


// --- Simplified UI Components ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm ${className}`}>{children}</div>
);

const Button = ({ onClick, children, disabled = false, variant = "primary", className = "" }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean; variant?: "primary" | "outline" | "ghost" | "danger"; className?: string }) => {
    const baseClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-500 shadow",
        outline: "border border-zinc-700 bg-transparent shadow-sm hover:bg-zinc-800 text-zinc-100",
        ghost: "hover:bg-zinc-800 text-zinc-300",
        danger: "bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClass} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-white ${props.className || ''}`} />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`flex min-h-[60px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-white ${props.className || ''}`} />
);

const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-200 ${className}`}>{children}</label>
);

const Select = ({ value, onChange, options }: { value: string; onChange: (val: string) => void; options: { label: string; value: string }[] }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
    >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
);

const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`peer inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-blue-600' : 'bg-zinc-700'
            }`}
    >
        <span
            data-state={checked ? 'checked' : 'unchecked'}
            className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'
                }`}
        />
    </button>
);


const AIControlPlane = () => {
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
            const res = await apiClient.get('/chatbots');
            setAgents(res.data);
        } catch (err) {
            console.error("Failed to load agents", err);
        }
    };

    const loadAgentConfig = async (agentId: number) => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/chatbots/${agentId}`);
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
            // Update the advancedConfig with capabilities
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
                    responseMode: 'balanced', // Default
                    candidateCount: 1, // Default
                    jsonMode: false // Default
                },
                vectorConfig: {
                    chunkingMode: config.vectorProcessing.chunkingMode,
                    chunkSize: config.vectorProcessing.chunkSize,
                    sensitivity: config.vectorProcessing.structureSensitivity,
                    contextWindow: 10, // Default derived
                    relevanceThreshold: config.vectorProcessing.minRelevance,
                    searchMode: 'semantic', // Default
                    enableReranking: false, // Default
                    chunkingStrategy: 'paragraph', // Default
                    chunkDelimiter: '\n\n', // Default
                    maxChunkSize: 2048, // Default
                    chunkOverlap: 100 // Default
                },
                prompts: config.prompts,
                whatsappConfig: config.whatsappConfig,
                advancedConfig: updatedAdvancedConfig
            };

            await apiClient.put(`/chatbots/${selectedAgent.id}`, payload);

            // Re-fetch to sync state
            await loadAgentConfig(selectedAgent.id);

            // Also update the agent lists's name/desc if changed
            setAgents(prev => prev.map(a =>
                a.id === selectedAgent.id ? { ...a, name: config.basic.name, description: config.basic.description, category: config.basic.category } : a
            ));

            alert("Agent configuration saved successfully!");
        } catch (err) {
            console.error("Failed to save", err);
            alert("Failed to save configuration.");
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

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Bot className="h-8 w-8 text-blue-400" />
                        Universal AI Control Plane
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Advanced configuration for System Agents, Vector Processing, and Cognitive Parameters.
                    </p>
                </div>
                <Button onClick={fetchAgents} variant="outline">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar: Agent List */}
                <Card className="md:col-span-1 min-h-[500px]">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-lg font-semibold text-white">System Agents</h2>
                    </div>
                    <div className="p-2 space-y-1">
                        {agents.map((agent) => (
                            <div
                                key={agent.id}
                                onClick={() => handleAgentSelect(agent)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedAgent?.id === agent.id
                                    ? 'bg-blue-900/30 border-blue-500/50 text-white'
                                    : 'bg-zinc-800/20 border-transparent hover:bg-zinc-800 text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${selectedAgent?.id === agent.id ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-gray-400'}`}>
                                        {agent.slug.includes('sales') ? <Sparkles className="h-4 w-4" /> :
                                            agent.slug.includes('creative') ? <Bot className="h-4 w-4" /> :
                                                <MessageSquare className="h-4 w-4" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-medium text-sm truncate">{agent.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{agent.slug}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Main Content: Configuration */}
                <Card className="md:col-span-3 min-h-[600px] flex flex-col">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                            <p>Loading agent configuration...</p>
                        </div>
                    ) : selectedAgent && config ? (
                        <>
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-t-lg">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                        <i className="fas fa-cogs"></i> {config.basic.name}
                                    </h2>
                                    <div className="flex gap-2 text-xs">
                                        <span className="text-gray-400">ID: {selectedAgent.id}</span>
                                        <span className="text-gray-500">|</span>
                                        <span className="text-blue-400">{config.aiConfig.model}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSaving ? 'Saving...' : 'Save Configuration'}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 overflow-x-auto">
                                <div className="flex space-x-6">
                                    {['info', 'technical', 'vector', 'prompts', 'capabilities'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)}
                                            className={`py-3 border-b-2 text-sm font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            {tab === 'info' && <span className="flex items-center gap-2"><Bot className="h-4 w-4" /> Basic Info</span>}
                                            {tab === 'technical' && <span className="flex items-center gap-2"><Sliders className="h-4 w-4" /> Technical Params</span>}
                                            {tab === 'vector' && <span className="flex items-center gap-2"><Database className="h-4 w-4" /> Vector Processing <span className="bg-green-900/50 text-green-400 text-[10px] px-1.5 py-0.5 rounded ml-1">NEW</span></span>}
                                            {tab === 'prompts' && <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Prompts System</span>}
                                            {tab === 'capabilities' && <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Capabilities</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto">

                                {/* TAB: BASIC INFO */}
                                {activeTab === 'info' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-blue-400">Agent Name</Label>
                                                    <Input
                                                        value={config.basic.name}
                                                        onChange={(e) => setConfig({ ...config, basic: { ...config.basic, name: e.target.value } })}
                                                        className="bg-zinc-900/50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-blue-400">Category</Label>
                                                    <Input
                                                        value={config.basic.category}
                                                        onChange={(e) => setConfig({ ...config, basic: { ...config.basic, category: e.target.value } })}
                                                        className="bg-zinc-900/50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-blue-400">Description</Label>
                                                    <Textarea
                                                        value={config.basic.description}
                                                        onChange={(e) => setConfig({ ...config, basic: { ...config.basic, description: e.target.value } })}
                                                        className="bg-zinc-900/50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-blue-400">Agent Class</Label>
                                                    <Input value={config.basic.class} readOnly className="bg-zinc-900/50 text-gray-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-blue-400">Specialization Level</Label>
                                                    <Select
                                                        value={config.basic.level.toString()}
                                                        options={[
                                                            { label: '1 - Beginner', value: '1' },
                                                            { label: '2 - Intermediate', value: '2' },
                                                            { label: '3 - Advanced', value: '3' },
                                                            { label: '4 - Expert', value: '4' },
                                                            { label: '5 - Master', value: '5' }
                                                        ]}
                                                        onChange={(v) => setConfig({ ...config, basic: { ...config.basic, level: parseInt(v) } })}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 mt-6">
                                                    <div>
                                                        <Label>Agent Status</Label>
                                                        <p className="text-xs text-gray-500">Active agents can be called by the application</p>
                                                    </div>
                                                    <Switch
                                                        checked={config.basic.active}
                                                        onCheckedChange={(c) => setConfig({ ...config, basic: { ...config.basic, active: c } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Providers Section */}
                                        <div className="border border-zinc-800 rounded-lg p-5 bg-zinc-900/30">
                                            <h3 className="text-md font-medium text-white mb-4 flex items-center gap-2">
                                                <Cpu className="h-4 w-4 text-blue-400" /> AI Configuration
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <Label className="text-blue-400 mb-2 block">AI Provider</Label>
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
                                                    <Label className="text-blue-400 mb-2 block">Model</Label>
                                                    <Input
                                                        value={config.aiConfig.model}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, aiConfig: { ...config.aiConfig, model: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: TECHNICAL PARAMETERS */}
                                {activeTab === 'technical' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-blue-400">Temperature ({config.aiConfig.temperature})</Label>
                                                <input
                                                    type="range" min="0" max="2" step="0.1"
                                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                                    value={config.aiConfig.temperature}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, aiConfig: { ...config.aiConfig, temperature: parseFloat(e.target.value) } })}
                                                />
                                                <p className="text-xs text-center text-gray-500">0-2: Creativity Control</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-400">Top-P ({config.aiConfig.topP})</Label>
                                                <input
                                                    type="range" min="0" max="1" step="0.05"
                                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                                    value={config.aiConfig.topP}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, aiConfig: { ...config.aiConfig, topP: parseFloat(e.target.value) } })}
                                                />
                                                <p className="text-xs text-center text-gray-500">0-1: Diversity Control</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-400">Top-K</Label>
                                                <Input
                                                    type="number"
                                                    value={config.aiConfig.topK}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, aiConfig: { ...config.aiConfig, topK: parseInt(e.target.value) } })}
                                                />
                                                <p className="text-xs text-gray-500 ml-1">1-100: Token Filtering</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-400">Max Tokens</Label>
                                                <Input
                                                    type="number"
                                                    value={config.aiConfig.maxTokens}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, aiConfig: { ...config.aiConfig, maxTokens: parseInt(e.target.value) } })}
                                                />
                                                <p className="text-xs text-gray-500 ml-1">Limit response length</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div className="space-y-2">
                                                <Label className="text-blue-400">Timeout (s)</Label>
                                                <Input
                                                    type="number"
                                                    value={config.aiConfig.timeout}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, aiConfig: { ...config.aiConfig, timeout: parseInt(e.target.value) } })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-blue-400">Retry Attempts</Label>
                                                <Input
                                                    type="number"
                                                    value={config.aiConfig.retries}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, aiConfig: { ...config.aiConfig, retries: parseInt(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: VECTOR PROCESSING */}
                                {activeTab === 'vector' && (
                                    <div className="space-y-6">
                                        <div className="border border-green-900/50 bg-green-900/10 rounded-lg p-4 mb-4">
                                            <h3 className="text-green-400 font-medium flex items-center gap-2">
                                                <Brain className="h-5 w-5" /> Advanced Vector Processing
                                            </h3>
                                        </div>

                                        <div className="flex space-x-2 border-b border-zinc-800 mb-6">
                                            {['chunking', 'quality', 'finetuning', 'embeddings'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setVectorTab(tab as any)}
                                                    className={`px-4 py-2 text-sm rounded-t-lg transition-colors capitalize ${vectorTab === tab ? 'bg-zinc-800 text-white' : 'text-gray-500 hover:text-gray-300'
                                                        }`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>

                                        {vectorTab === 'chunking' && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-2">
                                                    <Label className="text-green-500">Chunking Mode</Label>
                                                    <Select
                                                        value={config.vectorProcessing.chunkingMode}
                                                        options={[
                                                            { label: 'Semantic (Recommended)', value: 'semantico' },
                                                            { label: 'Hierarchical', value: 'hierarquico' },
                                                            { label: 'Hybrid', value: 'hibrido' },
                                                            { label: 'Basic', value: 'basico' }
                                                        ]}
                                                        onChange={(v) => setConfig({ ...config, vectorProcessing: { ...config.vectorProcessing, chunkingMode: v } })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-green-500">Chunk Size ({config.vectorProcessing.chunkSize} words)</Label>
                                                    <input
                                                        type="range" min="100" max="1000" step="25"
                                                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                                        value={config.vectorProcessing.chunkSize}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, vectorProcessing: { ...config.vectorProcessing, chunkSize: parseInt(e.target.value) } })}
                                                    />
                                                    <p className="text-xs text-center text-gray-500">Optimal for embeddings</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-green-500">Structure Sensitivity ({config.vectorProcessing.structureSensitivity}/10)</Label>
                                                    <input
                                                        type="range" min="1" max="10"
                                                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                                        value={config.vectorProcessing.structureSensitivity}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, vectorProcessing: { ...config.vectorProcessing, structureSensitivity: parseInt(e.target.value) } })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {vectorTab === 'quality' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-2">
                                                    <Label className="text-green-500">Min Relevance Score</Label>
                                                    <Select
                                                        value={config.vectorProcessing.minRelevance.toString()}
                                                        options={[
                                                            { label: '0.70 - Accept Most', value: '0.7' },
                                                            { label: '0.80 - Medium Quality', value: '0.8' },
                                                            { label: '0.90 - High Precision', value: '0.9' }
                                                        ]}
                                                        onChange={(v) => setConfig({ ...config, vectorProcessing: { ...config.vectorProcessing, minRelevance: parseFloat(v) } })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-green-500">Concept Weight ({config.vectorProcessing.conceptWeight}%)</Label>
                                                    <input
                                                        type="range" min="0" max="100" step="10"
                                                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                                        value={config.vectorProcessing.conceptWeight}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, vectorProcessing: { ...config.vectorProcessing, conceptWeight: parseInt(e.target.value) } })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {vectorTab === 'embeddings' && (
                                            <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-2">
                                                    <Label className="text-green-500">Embedding Model</Label>
                                                    <Select
                                                        value={config.vectorProcessing.embeddingModel}
                                                        options={[
                                                            { label: 'text-embedding-3-small (Fast)', value: 'text-embedding-3-small' },
                                                            { label: 'text-embedding-3-large (Precise)', value: 'text-embedding-3-large' },
                                                            { label: 'text-embedding-ada-002 (Legacy)', value: 'text-embedding-ada-002' }
                                                        ]}
                                                        onChange={(v) => setConfig({ ...config, vectorProcessing: { ...config.vectorProcessing, embeddingModel: v } })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Integration Switches */}
                                        <div className="border-t border-zinc-800 pt-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-between">
                                                <div>
                                                    <div className="text-green-400 font-medium">Use AI Assistant Library</div>
                                                    <div className="text-xs text-gray-500">Access specialized prompts</div>
                                                </div>
                                                <Switch checked={true} onCheckedChange={() => { }} />
                                            </div>
                                            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-between">
                                                <div>
                                                    <div className="text-green-400 font-medium">Active Vector Base</div>
                                                    <div className="text-xs text-gray-500">Semantic search enabled</div>
                                                </div>
                                                <Switch checked={true} onCheckedChange={() => { }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: PROMPTS */}
                                {activeTab === 'prompts' && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-amber-400">System Prompt (Core Personality)</Label>
                                            <Textarea
                                                className="min-h-[200px] font-mono text-sm border-amber-900/30 focus:ring-amber-500"
                                                value={config.prompts.system}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({ ...config, prompts: { ...config.prompts, system: e.target.value } })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-amber-400">Vector Search Prompt</Label>
                                                <Textarea
                                                    className="min-h-[100px] font-mono text-sm border-amber-900/30 focus:ring-amber-500"
                                                    value={config.prompts.vectorSearch}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({ ...config, prompts: { ...config.prompts, vectorSearch: e.target.value } })}
                                                    placeholder="Before answering, consult the vector base..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-amber-400">Analysis Prompt</Label>
                                                <Textarea
                                                    className="min-h-[100px] font-mono text-sm border-amber-900/30 focus:ring-amber-500"
                                                    value={config.prompts.analysis}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({ ...config, prompts: { ...config.prompts, analysis: e.target.value } })}
                                                    placeholder="Analyze the retrieved documents..."
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-amber-400">Structured Response Prompt</Label>
                                            <Textarea
                                                className="min-h-[150px] font-mono text-sm border-amber-900/30 focus:ring-amber-500"
                                                value={config.prompts.responseStructure}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({ ...config, prompts: { ...config.prompts, responseStructure: e.target.value } })}
                                                placeholder="Structure your response as follows..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-amber-400">Complex Cases Prompt</Label>
                                                <Textarea
                                                    className="min-h-[100px] font-mono text-sm border-amber-900/30 focus:ring-amber-500"
                                                    value={config.prompts.complexCases}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({ ...config, prompts: { ...config.prompts, complexCases: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-amber-400">Validation Prompt</Label>
                                                <Textarea
                                                    className="min-h-[100px] font-mono text-sm border-amber-900/30 focus:ring-amber-500"
                                                    value={config.prompts.validation}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({ ...config, prompts: { ...config.prompts, validation: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: CAPABILITIES */}
                                {activeTab === 'capabilities' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label className="text-blue-400">Defined Capabilities</Label>
                                            <Button onClick={addCapability} variant="outline" className="text-xs">
                                                <Plus className="h-3 w-3 mr-1" /> Add Capability
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {config.capabilities.map((cap, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <Input
                                                        value={cap}
                                                        onChange={(e) => updateCapability(idx, e.target.value)}
                                                        className="bg-zinc-900/50"
                                                    />
                                                    <Button onClick={() => removeCapability(idx)} variant="danger" className="px-3">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 p-12 text-center">
                            <div className="h-20 w-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6">
                                <Bot className="h-10 w-10 opacity-40 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-300">Select an Agent</h3>
                            <p className="max-w-xs mx-auto mt-2 text-sm">Select an agent from the sidebar list to configure their brain, personality, and data connections.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AIControlPlane;
