import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Play, Pause, Zap, Mail, MessageSquare, Clock, UserPlus, AlertCircle, Smartphone, Tag, Globe, ArrowLeft, Copy, Edit, Trash2, Save } from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';


interface WorkflowStep {
    id: string;
    type: 'wait' | 'email' | 'whatsapp' | 'notification' | 'sms' | 'tag' | 'owner' | 'webhook';
    value: string;
}

interface Workflow {
    id: number;
    name: string;
    status: 'active' | 'paused';
    triggers: string;
    steps: number;
    enrolled: number;
    conversion: string;
    stepsList?: WorkflowStep[]; // Added to store detailed steps
}

interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    trigger: string;
    steps: Omit<WorkflowStep, 'id'>[];
    iconType: 'user-plus' | 'clock' | 'zap' | 'git-branch' | 'message-square' | 'alert-circle';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper function to get icon component
const getTemplateIcon = (iconType: string) => {
    switch (iconType) {
        case 'user-plus': return <UserPlus className="text-green-600" size={24} />;
        case 'clock': return <Clock className="text-orange-600" size={24} />;
        case 'zap': return <Zap className="text-yellow-600" size={24} />;
        case 'git-branch': return <GitBranch className="text-purple-600" size={24} />;
        case 'message-square': return <MessageSquare className="text-blue-600" size={24} />;
        case 'alert-circle': return <AlertCircle className="text-red-600" size={24} />;
        default: return <Zap className="text-gray-600" size={24} />;
    }
};

// Workflow Templates
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'new_lead_nurture',
        name: 'Nutrição de Novo Lead',
        description: 'Sequência automática para engajar novos leads com conteúdo relevante',
        category: 'Vendas',
        trigger: 'Novo Lead Criado',
        iconType: 'user-plus',
        steps: [
            { type: 'wait', value: '5 minutos' },
            { type: 'email', value: 'Email de Boas-vindas - Apresentação da Empresa' },
            { type: 'wait', value: '1 dia' },
            { type: 'whatsapp', value: 'Olá! Vi que você se interessou por nossos serviços. Posso ajudar?' },
            { type: 'wait', value: '2 dias' },
            { type: 'email', value: 'Case de Sucesso - Como ajudamos empresas similares' },
            { type: 'tag', value: 'Lead Nutrido' }
        ]
    },
    {
        id: 'no_response_followup',
        name: 'Follow-up Sem Resposta',
        description: 'Reativa leads que não responderam após o primeiro contato',
        category: 'Vendas',
        trigger: 'Status: Aguardando > 24h',
        iconType: 'clock',
        steps: [
            { type: 'notification', value: 'Alerta: Lead sem resposta há 24h' },
            { type: 'whatsapp', value: 'Oi! Notei que ainda não conseguimos conversar. Tem alguma dúvida?' },
            { type: 'wait', value: '2 dias' },
            { type: 'email', value: 'Última chance - Oferta especial válida por 48h' },
            { type: 'tag', value: 'Precisa Follow-up' }
        ]
    },
    {
        id: 'high_value_alert',
        name: 'Alerta de Alto Valor',
        description: 'Notifica a equipe quando um lead de alto valor é criado',
        category: 'Notificações',
        trigger: 'Valor do Deal > R$ 5000',
        iconType: 'zap',
        steps: [
            { type: 'notification', value: '🔥 LEAD DE ALTO VALOR! Ação imediata necessária' },
            { type: 'owner', value: 'Atribuir ao: Gerente de Vendas' },
            { type: 'whatsapp', value: 'Olá! Obrigado pelo interesse. Um especialista entrará em contato em breve.' },
            { type: 'tag', value: 'VIP' }
        ]
    },
    {
        id: 'reengagement',
        name: 'Campanha de Reengajamento',
        description: 'Reativa leads inativos com ofertas especiais',
        category: 'Marketing',
        trigger: 'Inativo > 30 dias',
        iconType: 'git-branch',
        steps: [
            { type: 'email', value: 'Sentimos sua falta! Veja as novidades' },
            { type: 'wait', value: '3 dias' },
            { type: 'sms', value: 'Oferta exclusiva: 20% OFF para clientes antigos!' },
            { type: 'wait', value: '1 semana' },
            { type: 'email', value: 'Última chance - Oferta expira em 24h' },
            { type: 'tag', value: 'Reengajamento' }
        ]
    },
    {
        id: 'onboarding',
        name: 'Onboarding de Cliente',
        description: 'Guia novos clientes através do processo de configuração',
        category: 'Sucesso do Cliente',
        trigger: 'Status alterado para: Cliente',
        iconType: 'message-square',
        steps: [
            { type: 'email', value: 'Bem-vindo! Aqui está seu guia de início rápido' },
            { type: 'wait', value: '1 dia' },
            { type: 'whatsapp', value: 'Como está sendo sua experiência? Precisa de ajuda?' },
            { type: 'wait', value: '3 dias' },
            { type: 'notification', value: 'Agendar call de onboarding' },
            { type: 'tag', value: 'Onboarding Completo' }
        ]
    },
    {
        id: 'abandoned_cart',
        name: 'Carrinho Abandonado',
        description: 'Recupera vendas de carrinhos abandonados',
        category: 'E-commerce',
        trigger: 'Carrinho abandonado > 1h',
        iconType: 'alert-circle',
        steps: [
            { type: 'wait', value: '1 hora' },
            { type: 'email', value: 'Você esqueceu algo! Seus itens ainda estão aqui' },
            { type: 'wait', value: '6 horas' },
            { type: 'sms', value: 'Cupom de 10% OFF para finalizar sua compra agora!' },
            { type: 'wait', value: '1 dia' },
            { type: 'email', value: 'Última chance - Cupom expira em 2 horas' }
        ]
    }
];

const INITIAL_WORKFLOWS: Workflow[] = [
    {
        id: 1,
        name: 'Nutrição de Novo Lead',
        status: 'active',
        triggers: 'Novo Lead Criado',
        steps: 4,
        enrolled: 124,
        conversion: '12%',
        stepsList: [
            { id: '1', type: 'wait', value: '5 minutos' },
            { id: '2', type: 'email', value: 'Email de Boas-vindas' },
            { id: '3', type: 'wait', value: '2 dias' },
            { id: '4', type: 'whatsapp', value: 'Olá! Como podemos ajudar?' }
        ]
    },
    {
        id: 2,
        name: 'Follow-up Sem Resposta',
        status: 'active',
        triggers: 'Status: Aguardando > 24h',
        steps: 2,
        enrolled: 45,
        conversion: '8%',
        stepsList: [
            { id: '1', type: 'notification', value: 'Alerta: Lead sem resposta' },
            { id: '2', type: 'whatsapp', value: 'Oi! Ainda tem interesse?' }
        ]
    },
    {
        id: 3,
        name: 'Campanha de Reengajamento',
        status: 'paused',
        triggers: 'Inativo > 30 dias',
        steps: 3,
        enrolled: 890,
        conversion: '2%',
        stepsList: [
            { id: '1', type: 'email', value: 'Sentimos sua falta!' },
            { id: '2', type: 'wait', value: '3 dias' },
            { id: '3', type: 'sms', value: 'Cupom de desconto especial' }
        ]
    },
    {
        id: 4,
        name: 'Alerta de Alto Valor',
        status: 'active',
        triggers: 'Valor do Deal > R$ 5000',
        steps: 1,
        enrolled: 5,
        conversion: '-',
        stepsList: [
            { id: '1', type: 'notification', value: '🔥 LEAD DE ALTO VALOR!' }
        ]
    },
];

export const Automation: React.FC = () => {
    const [view, setView] = useState<'list' | 'create' | 'templates'>('list');
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form States
    const [newName, setNewName] = useState('');
    const [newTrigger, setNewTrigger] = useState('Novo Lead Criado');
    const [newSteps, setNewSteps] = useState<WorkflowStep[]>([]);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const response = await fetch(`${API_URL} /api/workflows`);
            const data = await response.json();
            setWorkflows(data);
        } catch (error) {
            console.error('Error fetching workflows:', error);
            setWorkflows(INITIAL_WORKFLOWS);
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = (template: WorkflowTemplate) => {
        setEditingId(null);
        setNewName(template.name);
        setNewTrigger(template.trigger);
        setNewSteps(template.steps.map((step, index) => ({
            ...step,
            id: `${Date.now()} -${index} `
        })));
        setView('create');
    };

    const handleEditWorkflow = (workflow: Workflow) => {
        setEditingId(workflow.id);
        setNewName(workflow.name);
        setNewTrigger(workflow.triggers);
        // If stepsList exists, use it. Otherwise create empty or default steps based on count
        setNewSteps(workflow.stepsList || Array(workflow.steps).fill(null).map((_, i) => ({
            id: `mock - ${i} `,
            type: 'wait',
            value: 'Passo carregado'
        })));
        setView('create');
    };

    const handleAddStep = (type: WorkflowStep['type']) => {
        const id = Date.now().toString();
        let defaultValue = '';

        switch (type) {
            case 'wait': defaultValue = '1 hora'; break;
            case 'email': defaultValue = 'Email de Boas-vindas'; break;
            case 'whatsapp': defaultValue = 'Olá! Tudo bem?'; break;
            case 'notification': defaultValue = 'Alerta ao Vendedor'; break;
            case 'sms': defaultValue = 'Promoção exclusiva hoje!'; break;
            case 'tag': defaultValue = 'Interesse Alto'; break;
            case 'owner': defaultValue = 'Atribuir a: Sarah'; break;
            case 'webhook': defaultValue = 'https://api.externa.com/v1/evento'; break;
        }

        setNewSteps([...newSteps, { id, type, value: defaultValue }]);
    };

    const handleRemoveStep = (id: string) => {
        setNewSteps(newSteps.filter(s => s.id !== id));
    };

    const handleStepChange = (id: string, val: string) => {
        setNewSteps(newSteps.map(s => s.id === id ? { ...s, value: val } : s));
    };

    const handleSave = () => {
        if (!newName.trim()) {
            alert("Dê um nome para a automação");
            return;
        }

        if (editingId) {
            // Update existing workflow
            setWorkflows(workflows.map(w => w.id === editingId ? {
                ...w,
                name: newName,
                triggers: newTrigger,
                steps: newSteps.length,
                stepsList: newSteps
            } : w));
        } else {
            // Create new workflow
            const newWorkflow: Workflow = {
                id: Date.now(),
                name: newName,
                status: 'active',
                triggers: newTrigger,
                steps: newSteps.length,
                enrolled: 0,
                conversion: '-',
                stepsList: newSteps
            };
            setWorkflows([newWorkflow, ...workflows]);
        }

        setView('list');
        setEditingId(null);

        // Reset Form
        setNewName('');
        setNewTrigger('Novo Lead Criado');
        setNewSteps([]);
    };

    const toggleWorkflowStatus = (id: number) => {
        setWorkflows(workflows.map(w =>
            w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w
        ));
    };

    const getStepIcon = (type: WorkflowStep['type']) => {
        switch (type) {
            case 'wait': return <Clock size={16} className="text-gray-600" />;
            case 'email': return <Mail size={16} className="text-blue-600" />;
            case 'whatsapp': return <MessageSquare size={16} className="text-green-600" />;
            case 'notification': return <AlertCircle size={16} className="text-orange-600" />;
            case 'sms': return <Smartphone size={16} className="text-purple-600" />;
            case 'tag': return <Tag size={16} className="text-pink-600" />;
            case 'owner': return <UserPlus size={16} className="text-indigo-600" />;
            case 'webhook': return <Globe size={16} className="text-teal-600" />;
        }
    };

    const getStepLabel = (type: WorkflowStep['type']) => {
        const labels = {
            wait: 'Aguardar',
            email: 'Enviar Email',
            whatsapp: 'WhatsApp',
            notification: 'Notificação',
            sms: 'SMS',
            tag: 'Adicionar Tag',
            owner: 'Atribuir Responsável',
            webhook: 'Webhook'
        };
        return labels[type];
    };

    // --- RENDER TEMPLATES VIEW ---
    if (view === 'templates') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('list')}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Templates de Automação</h2>
                        <p className="text-sm text-gray-500">Escolha um template pronto para começar rapidamente</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {WORKFLOW_TEMPLATES.map(template => (
                        <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {getTemplateIcon(template.iconType)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        {template.category}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                            <div className="space-y-2 mb-4">
                                <div className="text-xs text-gray-500">
                                    <strong>Gatilho:</strong> {template.trigger}
                                </div>
                                <div className="text-xs text-gray-500">
                                    <strong>Passos:</strong> {template.steps.length} ações
                                </div>
                            </div>
                            <button
                                onClick={() => handleUseTemplate(template)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Copy size={16} />
                                Usar Template
                            </button>
                        </div>
                    ))}
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-bold mb-2">Precisa de algo personalizado?</h3>
                    <p className="text-sm text-purple-100 mb-4">
                        Crie uma automação do zero com nosso construtor visual de workflows.
                    </p>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setNewName('');
                            setNewTrigger('Novo Lead Criado');
                            setNewSteps([]);
                            setView('create');
                        }}
                        className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-purple-50"
                    >
                        Criar do Zero
                    </button>
                </div>
            </div>
        );
    }

    // --- RENDER CREATE VIEW ---
    if (view === 'create') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('list')}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {editingId ? 'Editar Automação' : 'Criar Nova Automação'}
                        </h2>
                        <p className="text-sm text-gray-500">Configure o fluxo de trabalho automatizado</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    {/* Workflow Name */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Automação</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Ex: Nutrição de Novo Lead"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Trigger */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gatilho (Quando iniciar?)</label>
                        <select
                            value={newTrigger}
                            onChange={(e) => setNewTrigger(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option>Novo Lead Criado</option>
                            <option>Status: Aguardando &gt; 24h</option>
                            <option>Inativo &gt; 30 dias</option>
                            <option>Valor do Deal &gt; R$ 5000</option>
                            <option>Status alterado para: Cliente</option>
                            <option>Carrinho abandonado &gt; 1h</option>
                            <option>Lead respondeu WhatsApp</option>
                            <option>Email foi aberto</option>
                        </select>
                    </div>

                    {/* Steps */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Passos da Automação</label>

                        {newSteps.length === 0 && (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <GitBranch size={48} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500 text-sm">Nenhum passo adicionado ainda</p>
                                <p className="text-gray-400 text-xs">Clique nos botões abaixo para adicionar ações</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {newSteps.map((step, index) => (
                                <div key={step.id} className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getStepIcon(step.type)}
                                            <span className="text-sm font-medium text-gray-700">{getStepLabel(step.type)}</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={step.value}
                                            onChange={(e) => handleStepChange(step.id, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                            placeholder="Configure este passo..."
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleRemoveStep(step.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Step Buttons */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button onClick={() => handleAddStep('wait')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <Clock size={16} /> Aguardar
                            </button>
                            <button onClick={() => handleAddStep('email')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <Mail size={16} /> Email
                            </button>
                            <button onClick={() => handleAddStep('whatsapp')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <MessageSquare size={16} /> WhatsApp
                            </button>
                            <button onClick={() => handleAddStep('sms')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <Smartphone size={16} /> SMS
                            </button>
                            <button onClick={() => handleAddStep('notification')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <AlertCircle size={16} /> Notificação
                            </button>
                            <button onClick={() => handleAddStep('tag')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <Tag size={16} /> Tag
                            </button>
                            <button onClick={() => handleAddStep('owner')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <UserPlus size={16} /> Responsável
                            </button>
                            <button onClick={() => handleAddStep('webhook')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <Globe size={16} /> Webhook
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {editingId ? 'Atualizar Automação' : 'Salvar Automação'}
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER LIST VIEW ---
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Automação de Marketing <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.Automation}</span></h2>
                    <p className="text-sm text-gray-500">Gerencie seus fluxos de trabalho e gatilhos automatizados.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('templates')}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Copy size={18} />
                        Templates
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setNewName('');
                            setNewTrigger('Novo Lead Criado');
                            setNewSteps([]);
                            setView('create');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <Plus size={18} />
                        Nova Automação
                    </button>
                </div>
            </div>

            {/* Workflows List */}
            <div className="grid grid-cols-1 gap-4">
                {workflows.map(workflow => (
                    <div key={workflow.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{workflow.name}</h3>
                                    <span className={`px - 2 py - 1 rounded - full text - xs font - medium ${workflow.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                        } `}>
                                        {workflow.status === 'active' ? 'Ativo' : 'Pausado'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    <strong>Gatilho:</strong> {workflow.triggers}
                                </p>
                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                    <span>{workflow.steps} passos</span>
                                    <span>{workflow.enrolled} inscritos</span>
                                    <span>Taxa de conversão: {workflow.conversion}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEditWorkflow(workflow)}
                                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                                    title="Editar"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => toggleWorkflowStatus(workflow.id)}
                                    className={`p - 2 rounded - lg border ${workflow.status === 'active'
                                        ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                                        : 'border-green-300 text-green-600 hover:bg-green-50'
                                        } `}
                                    title={workflow.status === 'active' ? 'Pausar' : 'Ativar'}
                                >
                                    {workflow.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {workflows.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <GitBranch size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma automação criada ainda</h3>
                    <p className="text-gray-500 mb-6">Comece com um template ou crie uma automação personalizada</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setView('templates')}
                            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50"
                        >
                            Ver Templates
                        </button>
                        <button
                            onClick={() => setView('create')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                        >
                            Criar do Zero
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
