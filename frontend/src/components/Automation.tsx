import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Handle,
    Position,
    Connection,
    Edge,
    Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    GitBranch, Plus, Play, Pause, Zap, Mail, MessageSquare, Clock,
    UserPlus, AlertCircle, Smartphone, Tag, Globe, ArrowLeft,
    Copy, Edit, Trash2, Save, X, ShoppingCart, Calendar, Slack, BrainCircuit, Database,
    FileText, Hash, Kanban, CalendarClock, Radio, MousePointerClick, Loader2
} from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';
import { RichTextEditor } from './RichTextEditor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Workflow, WorkflowTemplate } from '../types';

// --- CONSTANTS & MOCKS ---

const NODE_TYPES_CONFIG = {
    // Gatilhos
    trigger: { label: 'Gatilho Manual', icon: <MousePointerClick size={16} />, color: 'bg-yellow-100 border-yellow-300' },
    trigger_form: { label: 'Formulário', icon: <FileText size={16} />, color: 'bg-yellow-100 border-yellow-300' },
    trigger_tag: { label: 'Tag Adicionada', icon: <Hash size={16} />, color: 'bg-yellow-100 border-yellow-300' },
    trigger_pipeline: { label: 'Mudança de Fase', icon: <Kanban size={16} />, color: 'bg-yellow-100 border-yellow-300' },
    trigger_schedule: { label: 'Agendamento', icon: <CalendarClock size={16} />, color: 'bg-yellow-100 border-yellow-300' },
    trigger_api: { label: 'Webhook (API)', icon: <Radio size={16} />, color: 'bg-yellow-100 border-yellow-300' },

    // Ações
    wait: { label: 'Aguardar', icon: <Clock size={16} />, color: 'bg-gray-100 border-gray-300' },
    email: { label: 'Email', icon: <Mail size={16} />, color: 'bg-blue-100 border-blue-300' },
    whatsapp: { label: 'WhatsApp', icon: <MessageSquare size={16} />, color: 'bg-green-100 border-green-300' },
    notification: { label: 'Notificação', icon: <AlertCircle size={16} />, color: 'bg-orange-100 border-orange-300' },
    sms: { label: 'SMS', icon: <Smartphone size={16} />, color: 'bg-purple-100 border-purple-300' },
    tag: { label: 'Tag', icon: <Tag size={16} />, color: 'bg-pink-100 border-pink-300' },
    owner: { label: 'Responsável', icon: <UserPlus size={16} />, color: 'bg-indigo-100 border-indigo-300' },
    webhook: { label: 'Webhook (Saída)', icon: <Globe size={16} />, color: 'bg-teal-100 border-teal-300' },
    condition: { label: 'Condição', icon: <GitBranch size={16} />, color: 'bg-gray-200 border-gray-400' },
    crm: { label: 'CRM Update', icon: <Database size={16} />, color: 'bg-cyan-100 border-cyan-300' },
    slack: { label: 'Slack', icon: <Slack size={16} />, color: 'bg-red-100 border-red-300' },
    ai_generate: { label: 'AI Generate', icon: <BrainCircuit size={16} />, color: 'bg-violet-100 border-violet-300' },
};

const TRIGGER_KEYS = ['trigger', 'trigger_form', 'trigger_tag', 'trigger_pipeline', 'trigger_schedule', 'trigger_api'];

// --- CUSTOM NODE COMPONENT ---

const CustomNode = ({ data }: any) => {
    const config = NODE_TYPES_CONFIG[data.type as keyof typeof NODE_TYPES_CONFIG] || NODE_TYPES_CONFIG.wait;

    return (
        <div className={`px-4 py-3 shadow-lg rounded-xl border-2 min-w-[200px] bg-white ${data.selected ? 'ring-2 ring-blue-500' : ''} ${config.color}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-white shadow-sm`}>
                    {config.icon}
                </div>
                <div>
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">{config.label}</div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[140px]" title={data.value}>{data.value || 'Configurar...'}</div>
                </div>
            </div>
            {/* Gatilhos só têm saída */}
            {!TRIGGER_KEYS.includes(data.type) && (
                <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-400" />
            )}
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

// ... (imports anteriores mantidos)
import { ExternalLink, Layers, Workflow as WorkflowIcon } from 'lucide-react';

// ... (código anterior até o início do componente Automation)

export const Automation: React.FC = () => {
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<'native' | 'n8n'>('native'); // Novo estado para alternar modos
    const [view, setView] = useState<'list' | 'create' | 'templates'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);

    // ... (hooks e mutations mantidos)

    // URL do n8n fornecida pelo usuário
    const N8N_URL = "https://arsdatascience-n8n.aiiam.com.br";

    // ... (resto da lógica do ReactFlow mantida: onConnect, onDragOver, onDrop, etc.)

    // Renderização do modo n8n
    if (mode === 'n8n') {
        return (
            <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in">
                <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <WorkflowIcon className="text-orange-600" /> Automação Avançada (n8n)
                        </h2>
                        <p className="text-sm text-gray-500">Crie fluxos complexos usando o poder do n8n integrado.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setMode('native')}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium flex items-center gap-2"
                        >
                            <Layers size={18} /> Voltar para Editor Simples
                        </button>
                        <a
                            href={N8N_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 flex items-center gap-2"
                        >
                            <ExternalLink size={18} /> Abrir em Nova Aba
                        </a>
                    </div>
                </div>
                <div className="flex-1 bg-gray-100 relative">
                    <iframe
                        src={N8N_URL}
                        className="w-full h-full border-none"
                        title="n8n Editor"
                        allow="clipboard-read; clipboard-write"
                    />
                    {/* Overlay informativo caso o iframe não carregue por restrições de segurança */}
                    <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm opacity-90 hover:opacity-100 transition-opacity">
                        <p className="text-xs text-gray-500 mb-2">
                            <strong>Nota:</strong> Se o editor não carregar aqui, pode ser devido a configurações de segurança do navegador ou do servidor n8n.
                        </p>
                        <p className="text-xs text-gray-500">
                            Use o botão "Abrir em Nova Aba" para acessar diretamente.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ... (lógica de renderização das views 'templates' e 'create' mantida, apenas ajustando o header para incluir o botão de troca de modo se necessário, ou mantendo simples)

    // Ajuste na visualização 'list' para incluir o botão de alternância para n8n
    if (view === 'list') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Automação de Marketing <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.Automation}</span></h2>
                        <p className="text-sm text-gray-500">Gerencie seus fluxos de trabalho e gatilhos automatizados.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setMode('n8n')}
                            className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 flex items-center gap-2"
                        >
                            <WorkflowIcon size={18} /> Ir para n8n
                        </button>
                        <button onClick={() => setView('templates')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                            <Copy size={18} /> Templates
                        </button>
                        <button onClick={handleCreateNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200">
                            <Plus size={18} /> Nova Automação
                        </button>
                    </div>
                </div>

                {isLoadingWorkflows ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {workflows.map((workflow: Workflow) => (
                            <div key={workflow.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{workflow.name}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${workflow.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {workflow.status === 'active' ? 'Ativo' : 'Pausado'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3"><strong>Gatilho:</strong> {workflow.triggers}</p>
                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            <span>{workflow.steps} passos</span>
                                            <span>{workflow.enrolled} inscritos</span>
                                            <span>Taxa de conversão: {workflow.conversion}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditWorkflow(workflow)} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50" title="Editar">
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(workflow.id)}
                                            disabled={toggleStatusMutation.isPending}
                                            className={`p-2 rounded-lg border ${workflow.status === 'active' ? 'border-orange-300 text-orange-600 hover:bg-orange-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                                        >
                                            {workflow.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null; // Fallback
};
