import React, { useState, useEffect } from 'react';
import { Bot, Save, Database, Sparkles, Sliders, FileText, Brain, ArrowLeft, Search, Activity, Shield, Target, Briefcase, GraduationCap, Gavel, BarChart3, Lightbulb, Server, X } from "lucide-react";
import { apiClient } from '@/services/apiClient';
import { useNavigate } from 'react-router-dom';
import { AIProvider, AI_MODELS } from '@/constants/aiModels';

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

interface DataSource {
    id: number;
    name: string;
    type: 'postgres' | 'qdrant';
    is_active: boolean;
}

interface AgentConfig {
    identity: {
        name: string;
        category: string;
        description: string;
        class: string;
        specializationLevel: number;
        status: boolean; // active
        specialtyArea: string;
        specificTools: string[];
        specializationFilters: string[];
    };
    aiConfig: {
        provider: string;
        model: string;
        temperature: number;
        maxTokens: number;
        topP: number;
        topK: number;
        seed: number | null;
        jsonMode: boolean;
        frequencyPenalty: number;
        presencePenalty: number;
        timeout: number;
        retries: number;
    };
    prompts: {
        system: string;
        extraContext: string;
        specialInstructions: string;
        responseStructure: string; // formato_resposta
        communicationTone: string;
        priorities: string;
        restrictions: string;
        usageExamples: string;
        // Legacy/Other
        analysis: string;
        vectorSearch: string;
        complexCases: string;
        validation: string;
        scriptContent: string;
    };
    vectorConfig: {
        searchMode: string; // semantica, palavra_chave, hibrido
        docLimit: number;
        enableReranking: boolean;
        relevanceWeight: number; // 0-1
        minRelevance: number; // similarity_threshold
        structureSensitivity: number; // 1-10
        useCache: boolean;
        aggregationMethod: string;
        // Technical internals
        chunkingMode: string;
        chunkSize: number;
        chunkOverlap: number;
        chunkingStrategy: string;
        embeddingModel: string;
        maxChunkSize: number;
    };
    whatsappConfig?: any;
    advancedConfig?: {
        knowledgeSources?: {
            [sourceId: number]: {
                enabled: boolean;
                selectedItems: string[];
            }
        };
        [key: string]: any;
    };
}

// --- Prompt Templates ---
const PROMPT_TEMPLATES = {
    sales: {
        label: "Vendas Consultivas (Sales)",
        icon: Briefcase,
        prompts: {
            system: `ATUAÇÃO: Você é um Consultor de Vendas Especialista.
MISSÃO: Vender produtos/serviços focando na transformação do cliente e geração de valor.
METODOLOGIA: SPIN Selling (Situação, Problema, Implicação, Necessidade).`,
            communicationTone: "Profissional, Persuasivo, Empático",
            priorities: "Entender a dor do cliente, apresentar soluções personalizadas, contornar objeções com valor.",
            restrictions: "Nunca fale o preço antes de gerar valor. Não prometa resultados impossíveis.",
            responseStructure: "1. Validação da Dor\n2. Conexão com Solução\n3. Prova Social\n4. Call to Action (CTA)",
            analysis: "Analise o Perfil do Cliente (BANT - Budget, Authority, Need, Timeline).",
            complexCases: "Cliente pede desconto: Apresente política de bônus ou valor agregado. Cliente cita concorrente: Foque no seu diferencial exclusivo.",
            validation: "Verifique se o cliente entendeu o valor antes de falar de preço.",
            extraContext: "Base de conhecimento de produtos e política comercial.",
            scriptContent: "Fase 1: Investigação (Perguntas Abertas)\nFase 2: Apresentação (Benefícios)\nFase 3: Fechamento (Opções de Pgto)"
        }
    },
    support: {
        label: "Atendimento & Suporte (Support)",
        icon: Shield,
        prompts: {
            system: `ATUAÇÃO: Agente de Suporte Técnico Nível 1/2.
OBJETIVO: Resolver tickets e dúvidas de forma rápida, didática e definitiva.
POSTURA: Paciente, Técnico e Resolutivo.`,
            communicationTone: "Didático, Paciente, Seguro",
            priorities: "SLA de atendimento, satisfação do cliente (CSAT), resolução no primeiro contato (FCR).",
            restrictions: "Não culpar o usuário. Não usar jargões sem explicar.",
            responseStructure: "1. Empatia/Acolhimento\n2. Diagnóstico\n3. Passo a Passo da Solução\n4. Confirmação de Resolução",
            analysis: "Identifique a severidade do problema e o humor do cliente.",
            complexCases: "Sistema fora do ar: Informe status page e previsão. Cliente irritado: Acolha e priorize.",
            validation: "Confirme se o passo a passo resolveu o problema.",
            extraContext: "Manuais técnicos, FAQ, Base de Erros Conhecidos.",
            scriptContent: "Roteiro de Triagem: Identificar Erro -> Consultar Base -> Fornecer Solução"
        }
    },
    marketing: {
        label: "Marketing Digital & Growth",
        icon: BarChart3,
        prompts: {
            system: `ATUAÇÃO: Estrategista de Marketing Digital.
OBJETIVO: Criar campanhas, analisar métricas e otimizar conversão (CRO).
FOCO: ROI, CAC, LTV e Engajamento.`,
            communicationTone: "Criativo, Analítico, Dinâmico",
            priorities: "Maximização de resultados, otimização de verba, criatividade em campanhas.",
            restrictions: "Evitar métricas de vaidade. Focar em métricas de negócio.",
            responseStructure: "1. Objetivo da Campanha\n2. Público-Alvo & Canais\n3. Estratégia de Conteúdo/Ads\n4. Métricas de Sucesso (KPIs)",
            analysis: "Analise funil de conversão e taxas de rejeição.",
            complexCases: "Campanha com baixo ROI: Propor testes A/B e revisão de criativos.",
            validation: "Verifique alinhamento com a brand persona.",
            extraContext: "Dados históricos de campanhas, branding guidelines.",
            scriptContent: "Checklist de Lançamento: Persona -> Oferta -> Canais -> Criativos -> Tracking"
        }
    },
    copywriting: {
        label: "Copywriting & Persuasão",
        icon: FileText,
        prompts: {
            system: `ATUAÇÃO: Copywriter Senior (Direct Response).
OBJETIVO: Escrever textos que vendem, engajam e convertem.
FRAMEWORKS: AIDA, PAS, Storytelling.`,
            communicationTone: "Provocativo, Envolvente, Persuasivo",
            priorities: "Retenção da atenção, clareza da oferta, força do CTA.",
            restrictions: "Evitar clichês. Não ser prolixo. Usar gatilhos mentais com integridade.",
            responseStructure: "Headline (Gancho)\nLead (Problema/História)\nBody (Solução/Prova)\nCTA (Oferta)",
            analysis: "Analise a sofisticação do mercado e o nível de consciência do lead.",
            complexCases: "Público cético: Usar mais prova social e garantias.",
            validation: "O texto passa no teste do 'So What?'",
            extraContext: "Swipe file de sucessos, avatar do cliente ideal.",
            scriptContent: "Estrutura de Carta de Vendas: Gancho -> História -> Problema -> Solução -> Oferta"
        }
    },
    hr: {
        label: "Recursos Humanos (Talent Hunter)",
        icon: Briefcase,
        prompts: {
            system: `ATUAÇÃO: Recrutador e Especialista em RH.
OBJETIVO: Identificar talentos, realizar triagem e avaliar fit cultural.
FOCO: Competências Técnicas (Hard Skills) e Comportamentais (Soft Skills).`,
            communicationTone: "Profissional, Acolhedor, Inclusivo",
            priorities: "Experiência do candidato, assertividade na contratação, diversidade.",
            restrictions: "Não fazer perguntas discriminatórias. Manter sigilo de dados.",
            responseStructure: "1. Análise do Perfil\n2. Pontos Fortes\n3. Pontos de Atenção\n4. Recomendação",
            analysis: "Compare o perfil do candidato com a Job Description.",
            complexCases: "Candidato superqualificado: Avaliar motivação e retenção.",
            validation: "O candidato tem alinhamento com a cultura da empresa?",
            extraContext: "Descrição de cargos, cultura organizacional, banco de talentos.",
            scriptContent: "Roteiro de Entrevista: Quebra-gelo -> Histórico -> Situcional -> Técnico -> Encerramento"
        }
    },
    legal: {
        label: "Jurídico (Legal Eagle)",
        icon: Gavel,
        prompts: {
            system: `ATUAÇÃO: Assistente Jurídico Sênior.
OBJETIVO: Analisar contratos, fornecer bases legais e redigir peças.
FOCO: Precisão terminológica, fundamentação legal e mitigação de riscos.`,
            communicationTone: "Formal, Técnico, Preciso",
            priorities: "Segurança jurídica, citação correta de leis/súmulas, clareza.",
            restrictions: "Não dar garantia de ganho de causa. Deixar claro que é uma IA assistente.",
            responseStructure: "1. Síntese dos Fatos\n2. Fundamentação Legal\n3. Jurisprudência Aplicável\n4. Conclusão/Parecer",
            analysis: "Identifique riscos contratuais e cláusulas abusivas.",
            complexCases: "Lei nova ou controversa: Citar correntes doutrinárias divergentes.",
            validation: "A fundamentação está atualizada com a última legislação?",
            extraContext: "Vade Mecum, Jurisprudência STJ/STF, Modelos de Contratos.",
            scriptContent: "Checklist Contratual: Partes -> Objeto -> Prazos -> Valores -> Rescisão -> Foro"
        }
    },
    finance: {
        label: "Financeiro (Financial Guardian)",
        icon: BarChart3,
        prompts: {
            system: `ATUAÇÃO: Consultor Financeiro Corporativo.
OBJETIVO: Analisar DRE, Fluxo de Caixa, ROI e sugerir otimizações.
FOCO: Saúde financeira, liquidez e rentabilidade.`,
            communicationTone: "Objetivo, Numérico, Prudente",
            priorities: "Precisão dos dados, análise de tendências, gestão de risco.",
            restrictions: "Não recomendar investimentos específicos (compliance). Focar em gestão.",
            responseStructure: "1. Diagnóstico Financeiro\n2. Análise de Indicadores\n3. Pontos de Melhoria\n4. Plano de Ação",
            analysis: "Calcule margens, EBTIDA e ponto de equilíbrio.",
            complexCases: "Empresa com fluxo negativo: Priorizar corte de custos e renegociação.",
            validation: "Os cálculos batem com as demonstrações contábeis?",
            extraContext: "Princípios contábeis, legislação tributária básica.",
            scriptContent: "Roteiro de Análise: Receitas -> Custos Variáveis -> Custos Fixos -> Resultado"
        }
    },
    education: {
        label: "Educacional (Education Mentor)",
        icon: GraduationCap,
        prompts: {
            system: `ATUAÇÃO: Mentor Educacional e Designer Instrucional.
OBJETIVO: Criar trilhas de aprendizado, explicar conceitos e avaliar progresso.
FOCO: Didática, Andragogia e Engajamento.`,
            communicationTone: "Inspirador, Didático, Mentor",
            priorities: "Clareza na explicação, adaptação ao nível do aluno, incentivo.",
            restrictions: "Não dar a resposta pronta em exercícios, guiar o raciocínio.",
            responseStructure: "1. Conceito Chave\n2. Exemplo Prático\n3. Analogia\n4. Exercício de Fixação",
            analysis: "Identifique lacunas de conhecimento do aluno.",
            complexCases: "Aluno com dificuldade: Simplificar e usar mais analogias.",
            validation: "O aluno confirmou o entendimento?",
            extraContext: "Currículo do curso, material didático de apoio.",
            scriptContent: "Estrutura de Aula: Introdução -> Conteúdo -> Prática -> Revisão"
        }
    },
    data: {
        label: "Ciência de Dados (Data Scientist)",
        icon: Database,
        prompts: {
            system: `ATUAÇÃO: Cientista de Dados Sênior.
OBJETIVO: Analisar datasets, criar modelos ML e gerar insights.
FOCO: Python, Pandas, SQL, Estatística e Visualização.`,
            communicationTone: "Técnico, Analítico, Baseado em Dados",
            priorities: "Integridade dos dados, significância estatística, clareza na visualização.",
            restrictions: "Não inferir causalidade sem prova. Citar fontes de dados.",
            responseStructure: "1. Entendimento do Problema\n2. Metodologia/Código\n3. Análise dos Resultados\n4. Próximos Passos",
            analysis: "Verifique outliers, missing values e correlações.",
            complexCases: "Dados inconclusivos: Sugerir coleta de mais dados.",
            validation: "O código é eficiente e seguro?",
            extraContext: "Documentação Pandas/Scikit-learn, dicionário de dados.",
            scriptContent: "Pipeline: Coleta -> Limpeza -> Análise Exploratória -> Modelagem -> Deploy"
        }
    },
    pm: {
        label: "Gestão de Projetos (Project Manager)",
        icon: Target,
        prompts: {
            system: `ATUAÇÃO: Gerente de Projetos (PMP/Agile).
OBJETIVO: Planejar cronogramas, gerir riscos e coordenar times.
FOCO: Escopo, Prazo, Custo e Qualidade.`,
            communicationTone: "Líder, Organizado, Resolutivo",
            priorities: "Cumprimento de prazos, alinhamento de expectativas, remoção de impedimentos.",
            restrictions: "Não microgerenciar. Focar em entregáveis.",
            responseStructure: "1. Status Report\n2. Riscos & Impedimentos\n3. Próximas Entregas\n4. Ações Necessárias",
            analysis: "Analise o caminho crítico e a carga de trabalho.",
            complexCases: "Projeto atrasado: Plano de recuperação e renegociação de escopo.",
            validation: "O plano é realista com os recursos disponíveis?",
            extraContext: "Metodologia Ágil/Scrum, PMBOK.",
            scriptContent: "Stand-up: O que fiz -> O que farei -> Impedimentos"
        }
    },
    strategy: {
        label: "Estratégia (System Brain)",
        icon: Brain,
        prompts: {
            system: `ATUAÇÃO: Diretor de Estratégia e Orquestrador de IA.
OBJETIVO: Coordenar múltiplos agentes, tomar decisões de alto nível e planejar longo prazo.
FOCO: Visão sistêmica, integração e eficiência operacionall.`,
            communicationTone: "Executivo, Estratégico, Visionário",
            priorities: "Alinhamento com objetivos de negócio, sinergia entre áreas.",
            restrictions: "Não se perder em detalhes operacionais (delegar).",
            responseStructure: "1. Visão Geral\n2. Análise de Cenário\n3. Diretriz Estratégica\n4. Delegação para Agentes Especialistas",
            analysis: "Analise o ecossistema como um todo.",
            complexCases: "Conflito entre áreas: Decidir pelo objetivo maior da empresa.",
            validation: "A decisão está alinhada com a missão da empresa?",
            extraContext: "Planejamento Estratégico, OKRs da empresa.",
            scriptContent: "Reunião de Board: Resultados Chave -> Desafios -> Decisões -> Encaminhamentos"
        }
    }
};

// --- Components UI (Light Theme) ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>{children}</div>
);

const Button = ({ onClick, children, disabled = false, variant = "primary", className = "" }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean; variant?: "primary" | "outline" | "ghost" | "danger" | "success" | "warning"; className?: string }) => {
    const baseClass = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2";
    const variants = {
        primary: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
        ghost: "hover:bg-gray-100 text-gray-600",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
        warning: "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200"
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

const Select = ({ value, onChange, options, multiple = false }: { value: string | string[]; onChange: (val: any) => void; options: { label: string; value: string }[]; multiple?: boolean }) => (
    <div className="relative">
        <select
            multiple={multiple}
            value={value}
            onChange={(e) => {
                if (multiple) {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    onChange(selected);
                } else {
                    onChange(e.target.value);
                }
            }}
            className={`flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 appearance-none ${multiple ? 'h-auto min-h-[120px]' : 'h-10'}`}
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {!multiple && (
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        )}
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

    // --- Data Sources State ---
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [sourceItems, setSourceItems] = useState<{ [key: number]: string[] }>({});
    const [loadingSources, setLoadingSources] = useState(false);

    // Tabs
    const [activeTab, setActiveTab] = useState<'identity' | 'ai' | 'technical' | 'behavior' | 'rag' | 'capabilities'>('identity');
    const [behaviorSubTab, setBehaviorSubTab] = useState<'prompt' | 'context' | 'communication' | 'examples'>('prompt');


    useEffect(() => {
        fetchAgents();
        fetchDataSources();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await apiClient.get('/agents?include_system=true');
            const allAgents = res.data;
            setAgents(allAgents);
        } catch (err) {
            console.error("Failed to load agents", err);
        }
    };

    const fetchDataSources = async () => {
        try {
            setLoadingSources(true);
            const res = await apiClient.get('/admin/datasources');
            setDataSources(res.data);
        } catch (err) {
            console.error("Failed to load data sources", err);
        } finally {
            setLoadingSources(false);
        }
    };

    const loadAgentConfig = async (agentId: number) => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/agents/${agentId}`);
            const data = res.data;

            setConfig({
                identity: {
                    name: data.identity?.name || '',
                    category: data.identity?.category || '',
                    description: data.identity?.description || '',
                    class: data.identity?.class || 'AgentePadrao',
                    specializationLevel: data.identity?.specializationLevel || 3,
                    status: data.identity?.status === 'active',
                    specialtyArea: data.identity?.specialtyArea || '',
                    specificTools: data.identity?.specificTools || [],
                    specializationFilters: data.identity?.specializationFilters || []
                },
                aiConfig: {
                    provider: data.aiConfig?.provider || 'openai',
                    model: data.aiConfig?.model || 'gpt-4o',
                    temperature: data.aiConfig?.temperature || 0.7,
                    maxTokens: data.aiConfig?.maxTokens || 2000,
                    topP: data.aiConfig?.topP || 0.95,
                    topK: data.aiConfig?.topK || 10,
                    seed: data.aiConfig?.seed || null,
                    jsonMode: data.aiConfig?.jsonMode || false,
                    frequencyPenalty: data.aiConfig?.frequencyPenalty || 0.0,
                    presencePenalty: data.aiConfig?.presencePenalty || 0.0,
                    timeout: data.aiConfig?.timeout || 60,
                    retries: data.aiConfig?.retries || 3
                },
                prompts: {
                    system: data.prompts?.system || '',
                    extraContext: data.prompts?.extraContext || '',
                    specialInstructions: data.prompts?.specialInstructions || '',
                    communicationTone: data.prompts?.communicationTone || '',
                    priorities: data.prompts?.priorities || '',
                    restrictions: data.prompts?.restrictions || '',
                    usageExamples: data.prompts?.usageExamples || '',
                    responseStructure: data.prompts?.responseStructure || '',
                    analysis: data.prompts?.analysis || '',
                    vectorSearch: data.prompts?.vectorSearch || '',
                    complexCases: data.prompts?.complexCases || '',
                    validation: data.prompts?.validation || '',
                    scriptContent: data.prompts?.scriptContent || ''
                },
                vectorConfig: {
                    searchMode: data.vectorConfig?.searchMode || 'hibrido',
                    docLimit: data.vectorConfig?.docLimit || 5,
                    enableReranking: data.vectorConfig?.enableReranking || true,
                    relevanceWeight: data.vectorConfig?.relevanceWeight || 0.7,
                    minRelevance: data.vectorConfig?.minRelevance || 0.7,
                    structureSensitivity: data.vectorConfig?.structureSensitivity || 7,
                    useCache: data.vectorConfig?.useCache !== false,
                    aggregationMethod: data.vectorConfig?.aggregationMethod || 'concatenacao',
                    chunkingMode: data.vectorConfig?.chunkingMode || 'semantico',
                    chunkSize: data.vectorConfig?.chunkSize || 512,
                    chunkOverlap: data.vectorConfig?.chunkOverlap || 50,
                    chunkingStrategy: data.vectorConfig?.chunkingStrategy || 'paragraph',
                    embeddingModel: data.vectorConfig?.embeddingModel || 'text-embedding-3-small',
                    maxChunkSize: data.vectorConfig?.maxChunkSize || 2048
                },
                whatsappConfig: data.whatsappConfig || {},
                advancedConfig: data.advancedConfig || { knowledgeSources: {} }
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
            const payload = {
                identity: {
                    name: config.identity.name,
                    description: config.identity.description,
                    category: config.identity.category,
                    class: config.identity.class,
                    specializationLevel: config.identity.specializationLevel,
                    status: config.identity.status ? 'active' : 'inactive',
                    specialtyArea: config.identity.specialtyArea,
                    specificTools: config.identity.specificTools,
                    specializationFilters: config.identity.specializationFilters
                },
                aiConfig: config.aiConfig,
                vectorConfig: config.vectorConfig,
                prompts: config.prompts,
                whatsappConfig: config.whatsappConfig,
                advancedConfig: config.advancedConfig
            };

            await apiClient.put(`/agents/${selectedAgent.id}`, payload);
            await loadAgentConfig(selectedAgent.id);
            setAgents(prev => prev.map(a =>
                a.id === selectedAgent.id ? { ...a, name: config.identity.name, description: config.identity.description, category: config.identity.category } : a
            ));
            alert("Configuração salva com sucesso!");
        } catch (err) {
            console.error("Failed to save", err);
            alert("Erro ao salvar configuração.");
        } finally {
            setIsSaving(false);
        }
    };

    const applyTemplate = (templateKey: string) => {
        if (!config) return;
        const template = PROMPT_TEMPLATES[templateKey as keyof typeof PROMPT_TEMPLATES];
        if (!template) return;

        if (confirm(`Aplicar template "${template.label}"?\nIsso substituirá os prompts atuais.`)) {
            setConfig({
                ...config,
                prompts: {
                    ...config.prompts,
                    ...template.prompts
                }
            });
        }
    };

    const handleIntrospectSource = async (sourceId: number) => {
        try {
            const res = await apiClient.get(`/admin/datasources/${sourceId}/introspect`);
            setSourceItems(prev => ({ ...prev, [sourceId]: res.data.items }));
        } catch (err) {
            console.error("Failed to introspect source", err);
            alert("Erro ao conectar e listar itens da fonte de dados.");
        }
    };

    const toggleDataSource = (sourceId: number, enabled: boolean) => {
        if (!config || !config.advancedConfig) return;
        const currentSources = config.advancedConfig.knowledgeSources || {};

        setConfig({
            ...config,
            advancedConfig: {
                ...config.advancedConfig,
                knowledgeSources: {
                    ...currentSources,
                    [sourceId]: {
                        ...currentSources[sourceId],
                        enabled: enabled,
                        selectedItems: currentSources[sourceId]?.selectedItems || []
                    }
                }
            }
        });

        if (enabled && !sourceItems[sourceId]) {
            handleIntrospectSource(sourceId);
        }
    };

    const updateSourceItems = (sourceId: number, items: string[]) => {
        if (!config || !config.advancedConfig) return;
        const currentSources = config.advancedConfig.knowledgeSources || {};

        setConfig({
            ...config,
            advancedConfig: {
                ...config.advancedConfig,
                knowledgeSources: {
                    ...currentSources,
                    [sourceId]: {
                        ...currentSources[sourceId],
                        selectedItems: items
                    }
                }
            }
        });
    };

    const systemAgents = agents.filter(a => a.is_system);
    const standardAgents = agents.filter(a => !a.is_system);

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
                                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                                    <Bot className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">AI Control Plane</h1>
                                    <p className="text-xs text-gray-500">Gestão Avançada de Especialistas (Conexões Ativas)</p>
                                </div>
                            </div>
                        </div>
                        <Button onClick={fetchAgents} variant="outline" className="gap-2">
                            <Search className="h-4 w-4" /> Atualizar Lista
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="md:col-span-3">
                        <Card className="h-full min-h-[700px] flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h2 className="font-semibold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Sparkles className="h-4 w-4 text-purple-500" /> Agentes de Sistema
                                </h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {systemAgents.length === 0 && <p className="p-4 text-sm text-gray-400">Nenhum agente de sistema.</p>}
                                {systemAgents.map((agent) => (
                                    <div
                                        key={agent.id}
                                        onClick={() => handleAgentSelect(agent)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedAgent?.id === agent.id
                                            ? 'bg-purple-50 border-purple-200 shadow-sm ring-1 ring-purple-200'
                                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedAgent?.id === agent.id ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                {agent.name.charAt(0)}
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
                                {standardAgents.length > 0 && (
                                    <>
                                        <div className="mt-4 px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Outros Agentes</div>
                                        {standardAgents.map((agent) => (
                                            <div key={agent.id} onClick={() => handleAgentSelect(agent)} className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedAgent?.id === agent.id ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'} opacity-75`}>
                                                <span className="text-sm text-gray-600">{agent.name}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-9">
                        <Card className="min-h-[700px] flex flex-col overflow-hidden border-0 shadow-lg relative">
                            {isLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <Activity className="h-10 w-10 animate-spin mb-3 text-purple-600" />
                                    <p>Carregando dados do Especialista...</p>
                                </div>
                            ) : selectedAgent && config ? (
                                <>
                                    {/* Toolbar */}
                                    <div className="p-4 px-6 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-20 backdrop-blur-sm bg-white/95">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                {config.identity.name}
                                                <span className={`px-2 py-0.5 rounded text-xs font-normal border ${config.identity.status ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                                                    {config.identity.status ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </h2>
                                            <p className="text-xs text-gray-500">ID: {selectedAgent.id} • {config.aiConfig.model}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleSave} disabled={isSaving} variant="success" className="h-9">
                                                {isSaving ? <Activity className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                                Salvar
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="border-b border-gray-200 px-6 bg-white">
                                        <div className="flex space-x-6 overflow-x-auto">
                                            {[
                                                { id: 'identity', label: 'Identidade', icon: Bot },
                                                { id: 'ai', label: 'Inteligência', icon: Brain },
                                                { id: 'technical', label: 'Parâmetros', icon: Sliders },
                                                { id: 'behavior', label: 'Comportamento & Prompts', icon: FileText },
                                                { id: 'rag', label: 'Conhecimento & Dados', icon: Database },
                                                { id: 'capabilities', label: 'Capacidades', icon: Shield }
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

                                    <div className="p-8 flex-1 bg-gray-50/50 overflow-y-auto">

                                        {/* --- IDENTIDADE --- */}
                                        {activeTab === 'identity' && (
                                            <div className="space-y-8 animate-fade-in max-w-4xl">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div><Label>Nome do Agente</Label> <Input value={config.identity.name} onChange={e => setConfig({ ...config, identity: { ...config.identity, name: e.target.value } })} /></div>
                                                        <div><Label>Categoria</Label> <Input value={config.identity.category} onChange={e => setConfig({ ...config, identity: { ...config.identity, category: e.target.value } })} /></div>
                                                        <div><Label>Descrição</Label> <Textarea value={config.identity.description} onChange={e => setConfig({ ...config, identity: { ...config.identity, description: e.target.value } })} /></div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div><Label>Classe (Read Only)</Label> <Input value={config.identity.class} readOnly className="bg-gray-100" /></div>
                                                        <div>
                                                            <Label>Nível de Especialização (1-5)</Label>
                                                            <Select
                                                                value={config.identity.specializationLevel.toString()}
                                                                options={['1', '2', '3', '4', '5'].map(n => ({ label: `Nível ${n}`, value: n }))}
                                                                onChange={v => setConfig({ ...config, identity: { ...config.identity, specializationLevel: parseInt(v) } })}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                                                            <Label>Ativo</Label>
                                                            <Switch checked={config.identity.status} onCheckedChange={c => setConfig({ ...config, identity: { ...config.identity, status: c } })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* --- INTELIGÊNCIA --- */}
                                        {activeTab === 'ai' && (
                                            <div className="space-y-6 animate-fade-in max-w-4xl">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <Label>Provedor</Label>
                                                        <Select
                                                            value={config.aiConfig.provider}
                                                            options={[
                                                                { label: 'OpenAI (GPT)', value: AIProvider.OPENAI },
                                                                { label: 'Google (Gemini)', value: AIProvider.GEMINI },
                                                                { label: 'Anthropic (Claude)', value: AIProvider.ANTHROPIC }
                                                            ]}
                                                            onChange={v => {
                                                                // When provider changes, reset model to first available or default
                                                                const newProvider = v as AIProvider;
                                                                const defaultModel = AI_MODELS[newProvider]?.[0]?.id || '';
                                                                setConfig({
                                                                    ...config,
                                                                    aiConfig: {
                                                                        ...config.aiConfig,
                                                                        provider: newProvider,
                                                                        model: defaultModel
                                                                    }
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Modelo</Label>
                                                        <Select
                                                            value={config.aiConfig.model}
                                                            options={AI_MODELS[config.aiConfig.provider as AIProvider]?.map(m => ({ label: m.name, value: m.id })) || []}
                                                            onChange={v => setConfig({ ...config, aiConfig: { ...config.aiConfig, model: v } })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Tokens Máximos</Label>
                                                        <Input type="number" value={config.aiConfig.maxTokens} onChange={e => setConfig({ ...config, aiConfig: { ...config.aiConfig, maxTokens: parseInt(e.target.value) } })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* --- PARÂMETROS --- */}
                                        {activeTab === 'technical' && (
                                            <div className="space-y-8 animate-fade-in max-w-4xl">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <div className="flex justify-between mb-2"><Label>Temperatura</Label> <span className="text-xs bg-gray-200 px-2 rounded">{config.aiConfig.temperature}</span></div>
                                                            <input type="range" min="0" max="2" step="0.1" className="w-full" value={config.aiConfig.temperature} onChange={e => setConfig({ ...config, aiConfig: { ...config.aiConfig, temperature: parseFloat(e.target.value) } })} />
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between mb-2"><Label>Top-P</Label> <span className="text-xs bg-gray-200 px-2 rounded">{config.aiConfig.topP}</span></div>
                                                            <input type="range" min="0" max="1" step="0.05" className="w-full" value={config.aiConfig.topP} onChange={e => setConfig({ ...config, aiConfig: { ...config.aiConfig, topP: parseFloat(e.target.value) } })} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><Label>Frequency Penalty</Label><Input type="number" step="0.1" value={config.aiConfig.frequencyPenalty} onChange={e => setConfig({ ...config, aiConfig: { ...config.aiConfig, frequencyPenalty: parseFloat(e.target.value) } })} /></div>
                                                            <div><Label>Presence Penalty</Label><Input type="number" step="0.1" value={config.aiConfig.presencePenalty} onChange={e => setConfig({ ...config, aiConfig: { ...config.aiConfig, presencePenalty: parseFloat(e.target.value) } })} /></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><Label>Top-K</Label><Input type="number" value={config.aiConfig.topK} onChange={e => setConfig({ ...config, aiConfig: { ...config.aiConfig, topK: parseInt(e.target.value) } })} /></div>
                                                            <div><Label>Seed</Label><Input type="number" placeholder="Random" value={config.aiConfig.seed || ''} onChange={e => setConfig({ ...config, aiConfig: { ...config.aiConfig, seed: parseInt(e.target.value) || null } })} /></div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-4">
                                                            <Switch checked={config.aiConfig.jsonMode} onCheckedChange={c => setConfig({ ...config, aiConfig: { ...config.aiConfig, jsonMode: c } })} />
                                                            <Label>JSON Mode (Strict Output)</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* --- COMPORTAMENTO --- */}
                                        {activeTab === 'behavior' && (
                                            <div className="space-y-6 animate-fade-in max-w-5xl">
                                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600"><Lightbulb className="w-5 h-5" /></div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-gray-800">Galeria de Templates de Engenharia de Prompt</h3>
                                                            <p className="text-xs text-gray-500">Aplique prompts prontos validados para iniciar.</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            className="h-9 rounded-lg border-gray-300 text-sm focus:ring-purple-500"
                                                            onChange={(e) => applyTemplate(e.target.value)}
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>Selecione um Template...</option>
                                                            {Object.entries(PROMPT_TEMPLATES).map(([key, tpl]) => (
                                                                <option key={key} value={key}>{tpl.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-max mb-4">
                                                    {['prompt', 'context', 'communication', 'examples'].map(st => (
                                                        <button key={st} onClick={() => setBehaviorSubTab(st as any)} className={`px-4 py-2 text-xs font-semibold rounded-md uppercase tracking-wider ${behaviorSubTab === st ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:bg-gray-200'}`}>
                                                            {st === 'prompt' && 'System Prompt'}
                                                            {st === 'context' && 'Contexto & Instruções'}
                                                            {st === 'communication' && 'Comunicação'}
                                                            {st === 'examples' && 'Exemplos (Few-Shot)'}
                                                        </button>
                                                    ))}
                                                </div>

                                                {behaviorSubTab === 'prompt' && (
                                                    <div className="space-y-4">
                                                        <Label className="text-yellow-600 font-bold">System Prompt Principal</Label>
                                                        <Textarea className="min-h-[400px] font-mono text-sm bg-gray-900 text-green-400 p-4 leading-relaxed" value={config.prompts.system} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, system: e.target.value } })} />
                                                    </div>
                                                )}
                                                {behaviorSubTab === 'context' && (
                                                    <div className="space-y-6">
                                                        <div><Label>Contexto Adicional (Knowledge Base Textual)</Label><Textarea className="min-h-[100px]" value={config.prompts.extraContext} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, extraContext: e.target.value } })} /></div>
                                                        <div><Label>Instruções Especiais / Diretrizes</Label><Textarea className="min-h-[100px]" value={config.prompts.specialInstructions} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, specialInstructions: e.target.value } })} /></div>
                                                        <div><Label>Conteúdo do Script (Roteiro)</Label><Textarea className="min-h-[100px]" value={config.prompts.scriptContent} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, scriptContent: e.target.value } })} /></div>
                                                    </div>
                                                )}
                                                {behaviorSubTab === 'communication' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div><Label>Tom de Comunicação</Label><Input value={config.prompts.communicationTone} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, communicationTone: e.target.value } })} /></div>
                                                        <div><Label>Formato de Resposta</Label><Input value={config.prompts.responseStructure} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, responseStructure: e.target.value } })} /></div>
                                                        <div><Label>Prioridades</Label><Textarea value={config.prompts.priorities} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, priorities: e.target.value } })} /></div>
                                                        <div><Label>Restrições</Label><Textarea value={config.prompts.restrictions} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, restrictions: e.target.value } })} /></div>
                                                        <div><Label>Análise</Label><Textarea value={config.prompts.analysis} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, analysis: e.target.value } })} /></div>
                                                        <div><Label>Validação</Label><Textarea value={config.prompts.validation} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, validation: e.target.value } })} /></div>
                                                    </div>
                                                )}
                                                {behaviorSubTab === 'examples' && (
                                                    <div className="space-y-4">
                                                        <Label>Exemplos de Uso</Label>
                                                        <Textarea className="min-h-[300px] font-mono bg-gray-50" value={config.prompts.usageExamples} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, usageExamples: e.target.value } })} />
                                                        <div className="mt-4"><Label>Prompt Casos Complexos</Label><Textarea value={config.prompts.complexCases} onChange={e => setConfig({ ...config, prompts: { ...config.prompts, complexCases: e.target.value } })} /></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* --- RAG & CONHECIMENTO --- */}
                                        {activeTab === 'rag' && (
                                            <div className="space-y-8 animate-fade-in max-w-5xl">

                                                {/* DATA SOURCES SECTION */}
                                                <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                        <Database className="h-5 w-5 text-purple-600" />
                                                        Fontes de Dados Conectadas (External DBs)
                                                    </h3>
                                                    {loadingSources ? (
                                                        <div className="flex items-center text-sm text-gray-500"><Activity className="animate-spin mr-2 h-4 w-4" /> Carregando fontes...</div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {dataSources.map(source => {
                                                                const sourceConfig = config.advancedConfig?.knowledgeSources?.[source.id] || { enabled: false, selectedItems: [] };

                                                                return (
                                                                    <div key={source.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                                        <div className="bg-gray-50 p-3 flex items-center justify-between">
                                                                            <div className="flex items-center gap-3">
                                                                                <Server className="h-4 w-4 text-gray-500" />
                                                                                <span className="font-semibold text-gray-700 text-sm">{source.name}</span>
                                                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase">{source.type}</span>
                                                                            </div>
                                                                            <Switch
                                                                                checked={sourceConfig.enabled}
                                                                                onCheckedChange={(checked) => toggleDataSource(source.id, checked)}
                                                                            />
                                                                        </div>

                                                                        {sourceConfig.enabled && (
                                                                            <div className="p-4 bg-white border-t border-gray-100 animate-fade-in">
                                                                                {sourceItems[source.id] ? (
                                                                                    <div className="space-y-2">
                                                                                        <Label>Selecione os Itens ({source.type === 'postgres' ? 'Tabelas' : 'Coleções'}) Permissionados:</Label>
                                                                                        <Select
                                                                                            multiple
                                                                                            value={sourceConfig.selectedItems}
                                                                                            options={sourceItems[source.id].map(item => ({ label: item, value: item }))}
                                                                                            onChange={(val) => updateSourceItems(source.id, val)}
                                                                                        />
                                                                                        <p className="text-xs text-gray-400">Segure Ctrl (Windows) ou Cmd (Mac) para selecionar múltiplos.</p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex flex-col items-center justify-center p-4 text-gray-400">
                                                                                        <p className="text-sm mb-2">Conectando à fonte...</p>
                                                                                        <Activity className="animate-spin h-5 w-5 text-gray-300" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                <hr className="border-gray-200" />

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <Label>Método de Busca (Vector)</Label>
                                                        <Select value={config.vectorConfig.searchMode} options={[{ label: 'Semântica', value: 'semantica' }, { label: 'Palavra-Chave', value: 'palavra_chave' }, { label: 'Híbrido (Rec.)', value: 'hibrido' }]} onChange={v => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, searchMode: v } })} />
                                                    </div>
                                                    <div>
                                                        <Label>Qtd. Documentos</Label>
                                                        <Input type="number" min="1" max="20" value={config.vectorConfig.docLimit} onChange={e => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, docLimit: parseInt(e.target.value) } })} />
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 border rounded bg-white mt-6">
                                                        <Label>Usar Reranking</Label>
                                                        <Switch checked={config.vectorConfig.enableReranking} onCheckedChange={c => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, enableReranking: c } })} />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-white border border-gray-200 rounded-xl">
                                                    <div>
                                                        <div className="flex justify-between mb-2"><Label>Limiar de Similaridade</Label> <span>{config.vectorConfig.minRelevance}</span></div>
                                                        <input type="range" min="0" max="1" step="0.05" className="w-full" value={config.vectorConfig.minRelevance} onChange={e => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, minRelevance: parseFloat(e.target.value) } })} />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between mb-2"><Label>Peso de Relevância (Semântica vs Keyword)</Label> <span>{config.vectorConfig.relevanceWeight}</span></div>
                                                        <input type="range" min="0" max="1" step="0.1" className="w-full" value={config.vectorConfig.relevanceWeight} onChange={e => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, relevanceWeight: parseFloat(e.target.value) } })} />
                                                    </div>
                                                </div>

                                            </div>
                                        )}

                                        {/* --- CAPACIDADES --- */}
                                        {activeTab === 'capabilities' && (
                                            <div className="space-y-6 animate-fade-in max-w-4xl">
                                                <div className="p-6 bg-white rounded-xl border border-gray-200">
                                                    <Label className="mb-4 block text-lg font-semibold">Ferramentas Habilitadas</Label>

                                                    {/* TAGS INPUT COMPONENT */}
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap gap-2 mb-2 p-2 min-h-[40px] bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
                                                            {config.identity.specificTools?.map((tool, idx) => (
                                                                <span key={idx} className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-1 animate-scale-in">
                                                                    {tool}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newTools = config.identity.specificTools.filter((_, i) => i !== idx);
                                                                            setConfig({ ...config, identity: { ...config.identity, specificTools: newTools } });
                                                                        }}
                                                                        className="hover:text-purple-900 focus:outline-none"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                            <input
                                                                type="text"
                                                                placeholder="Adicionar ferramenta... (Enter)"
                                                                className="flex-1 min-w-[150px] outline-none text-sm p-1"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        const val = e.currentTarget.value.trim();
                                                                        if (val && !config.identity.specificTools.includes(val)) {
                                                                            setConfig({
                                                                                ...config,
                                                                                identity: {
                                                                                    ...config.identity,
                                                                                    specificTools: [...config.identity.specificTools, val]
                                                                                }
                                                                            });
                                                                            e.currentTarget.value = '';
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 flex-wrap">
                                                            <span className="text-xs text-gray-500">Sugestões:</span>
                                                            {[
                                                                'Busca de Legislação', 'Consulta Processual', 'Cálculo de Prazos',
                                                                'Análise de Contratos', 'Geração de Peças', 'Análise Financeira',
                                                                'Busca Web', 'Geração de Imagens', 'Python Interpreter'
                                                            ].filter(t => !config.identity.specificTools.includes(t)).map(t => (
                                                                <button
                                                                    key={t}
                                                                    type="button"
                                                                    onClick={() => setConfig({
                                                                        ...config,
                                                                        identity: {
                                                                            ...config.identity,
                                                                            specificTools: [...config.identity.specificTools, t]
                                                                        }
                                                                    })}
                                                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                                                                >
                                                                    + {t}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="p-4 bg-gray-100 rounded-lg">
                                                        <Label>Cache de Respostas</Label>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Switch checked={config.vectorConfig.useCache} onCheckedChange={c => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, useCache: c } })} />
                                                            <span className="text-sm">Ativar Cache (Redis)</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-gray-100 rounded-lg">
                                                        <Label>Método de Agregação (RAG)</Label>
                                                        <Select value={config.vectorConfig.aggregationMethod} options={[{ label: 'Concatenação', value: 'concatenacao' }, { label: 'Sumarização', value: 'sumarizacao' }]} onChange={v => setConfig({ ...config, vectorConfig: { ...config.vectorConfig, aggregationMethod: v } })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50">
                                    <div className="h-24 w-24 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm">
                                        <Bot className="h-10 w-10 text-purple-300" />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900">Selecione um Especialista</h3>
                                    <p className="max-w-md mx-auto mt-2 text-gray-500">
                                        Configure os Agentes de Sistema utilizando o template completo de Especialista.
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
