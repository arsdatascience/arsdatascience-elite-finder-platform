const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\DenisMay\\elite-finder-appv1\\frontend\\src\\components\\AgentBuilder.tsx';

const newHeader = `import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
    Save, MessageSquare, Wand2, LayoutTemplate, Fingerprint, Brain,
    Database, Smartphone, Shield, Check, X, RefreshCw, Loader2,
    Settings, Share2, Play, Pause, RotateCcw
} from 'lucide-react';

// Interfaces
interface AgentConfig {
    id?: string;
    identity: {
        name: string;
        description: string;
        category: string;
        class: string;
        specializationLevel: number;
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
        seed?: number;
        jsonMode?: boolean;
        stopSequences?: string[];
    };
    vectorConfig: {
        knowledgeBaseId: string;
        chunkingMode: string;
        chunkSize: number;
        searchMode: string;
        enableReranking: boolean;
        sensitivity: number;
        filters: string[];
        contextWindow: number;
        relevanceThreshold: number;
        chunkingStrategy?: string;
        chunkDelimiter?: string;
        maxChunkSize?: number;
        chunkOverlap?: number;
        hybridConfig?: {
            semanticPrecision: number;
            contextualWeight: number;
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
        provider: 'evolution_api' | 'official';
        evolution: {
            baseUrl: string;
            apiKey: string;
            instanceName: string;
        };
        official: {
            phoneNumberId: string;
            accessToken: string;
            verifyToken: string;
        };
    };
    advancedConfig?: {
        multiModelValidation: {
            minConsensus: number;
            parallelModels: number;
        };
        qualitySafety: {
            hallucinationCheck: {
                sensitivity: number;
            };
            semanticCache: {
                similarityThreshold: number;
            };
        };
        kpis?: { name: string; target: string }[];
    };
}

const INITIAL_CONFIG: AgentConfig = {
    identity: {
        name: 'Novo Agente',
        description: '',
        category: 'service',
        class: 'StandardAgent',
        specializationLevel: 3
    },
    aiConfig: {
        provider: 'openai',
        model: 'gpt-4.1',
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        maxTokens: 1000,
        timeout: 30,
        retries: 3,
        frequencyPenalty: 0,
        presencePenalty: 0,
        responseMode: 'balanced',
        candidateCount: 1,
        jsonMode: false,
        stopSequences: []
    },
    vectorConfig: {
        knowledgeBaseId: '',
        chunkingMode: 'semantic',
        chunkSize: 300,
        searchMode: 'hybrid',
        enableReranking: true,
        sensitivity: 7,
        filters: [],
        contextWindow: 5,
        relevanceThreshold: 0.7,
        chunkingStrategy: 'paragraph',
        chunkDelimiter: '\\n\\n',
        maxChunkSize: 2048,
        chunkOverlap: 100,
        hybridConfig: {
            semanticPrecision: 0.85,
            contextualWeight: 0.25
        }
    },
    prompts: {
        system: '',
        responseStructure: '',
        vectorSearch: '',
        analysis: '',
        complexCases: '',
        validation: '',
        scriptContent: ''
    },
    whatsappConfig: {
        enabled: false,
        provider: 'evolution_api',
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
    advancedConfig: {
        multiModelValidation: {
            minConsensus: 0.75,
            parallelModels: 3
        },
        qualitySafety: {
            hallucinationCheck: {
                sensitivity: 0.8
            },
            semanticCache: {
                similarityThreshold: 0.9
            }
        },
        kpis: []
    }
};

const TABS = [
    { id: 'identity', label: 'Identidade', icon: Fingerprint },
    { id: 'ai', label: 'Inteligência Artificial', icon: Brain },
    { id: 'vector', label: 'Base de Conhecimento', icon: Database },
    { id: 'prompts', label: 'Engenharia de Prompt', icon: MessageSquare },
    { id: 'channels', label: 'Canais & Integrações', icon: Smartphone },
    { id: 'advanced', label: 'Otimização Avançada', icon: Settings },
    { id: 'deploy', label: 'Deploy & Widget', icon: LayoutTemplate }
];

export const AgentBuilder: React.FC = () => {
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get('template');
    
    const [activeTab, setActiveTab] = useState<'identity' | 'ai' | 'vector' | 'prompts' | 'channels' | 'advanced' | 'deploy'>('identity');
    const [config, setConfig] = useState<AgentConfig>(INITIAL_CONFIG);
    const [qdrantConnected, setQdrantConnected] = useState(false);
    const [qdrantCollections, setQdrantCollections] = useState<any[]>([]);
    const [loadingCollections, setLoadingCollections] = useState(false);
    
    // Template States
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [showSetupButton, setShowSetupButton] = useState(false);

    // Magic Config States
    const [showMagicModal, setShowMagicModal] = useState(false);
    const [magicDescription, setMagicDescription] = useState('');
    const [isGeneratingConfig, setIsGeneratingConfig] = useState(false);

    const saveAgentMutation = useMutation({
        mutationFn: async (agentConfig: AgentConfig) => {
            const response = await fetch(\`\${import.meta.env.VITE_API_URL}/api/agents\`, {
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
            alert(\`Agente "\${data.name}" salvo com sucesso! (ID: \${data.id})\`);
        },
        onError: (error: any) => {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar agente: ' + error.message);
        }
    });
`;

const fileContent = fs.readFileSync(filePath, 'utf8');
const lines = fileContent.split('\\n');

// Remove the first 23 lines
const remainingLines = lines.slice(23);

const newContent = newHeader + remainingLines.join('\\n');

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('File updated successfully.');
