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

export const Automation: React.FC = () => {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'list' | 'create' | 'templates'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);

    // React Query
    const { data: workflows = [], isLoading: isLoadingWorkflows } = useQuery<Workflow[]>({
        queryKey: ['workflows'],
        queryFn: apiClient.automation.getWorkflows
    });

    const { data: templates = [] } = useQuery<WorkflowTemplate[]>({
        queryKey: ['workflowTemplates'],
        queryFn: apiClient.automation.getTemplates
    });

    const saveMutation = useMutation({
        mutationFn: apiClient.automation.saveWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            setView('list');
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: apiClient.automation.toggleStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        }
    });

    // Flow States
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    // Form States (Metadata)
    const [newName, setNewName] = useState('');

    // Properties Panel State
    const [nodeValue, setNodeValue] = useState('');

    // --- FLOW HANDLERS ---

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds)), [setEdges]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: Date.now().toString(),
                type: 'custom',
                position,
                data: {
                    type,
                    value: type.startsWith('trigger') ? `Novo ${NODE_TYPES_CONFIG[type as keyof typeof NODE_TYPES_CONFIG].label}` : `Nova ${NODE_TYPES_CONFIG[type as keyof typeof NODE_TYPES_CONFIG].label}`
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
        setNodeValue(node.data.value);
    };

    const updateNodeValue = (val: string) => {
        setNodeValue(val);
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNodeId) {
                    node.data = { ...node.data, value: val };
                }
                return node;
            })
        );
    };

    const deleteSelectedNode = () => {
        if (selectedNodeId) {
            setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
            setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
            setSelectedNodeId(null);
        }
    };

    // --- ACTION HANDLERS ---

    const handleUseTemplate = (template: WorkflowTemplate) => {
        setEditingId(null);
        setNewName(template.name);

        // Converter template steps para nodes/edges
        const initialNodes: Node[] = [
            { id: 'trigger', type: 'custom', position: { x: 250, y: 0 }, data: { type: 'trigger', value: template.trigger } }
        ];
        const initialEdges: Edge[] = [];

        template.steps.forEach((step, index) => {
            const id = `step-${index}`;
            const prevId = index === 0 ? 'trigger' : `step-${index - 1}`;

            initialNodes.push({
                id,
                type: 'custom',
                position: { x: 250, y: (index + 1) * 100 },
                data: { type: step.type, value: step.value }
            });

            initialEdges.push({
                id: `e-${prevId}-${id}`,
                source: prevId,
                target: id,
                type: 'smoothstep',
                animated: true
            });
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
        setView('create');
    };

    const handleEditWorkflow = (workflow: Workflow) => {
        setEditingId(workflow.id);
        setNewName(workflow.name);

        if (workflow.flowData) {
            setNodes(workflow.flowData.nodes);
            setEdges(workflow.flowData.edges);
        } else {
            // Fallback se não tiver flowData (converter stepsList antigo)
            // ... implementação simplificada
            setNodes([]);
            setEdges([]);
        }
        setView('create');
    };

    const handleCreateNew = () => {
        setEditingId(null);
        setNewName('');
        setNodes([
            { id: 'trigger', type: 'custom', position: { x: 250, y: 50 }, data: { type: 'trigger', value: 'Novo Lead Criado' } }
        ]);
        setEdges([]);
        setView('create');
    };

    const handleSave = () => {
        if (!newName.trim()) {
            alert("Dê um nome para a automação");
            return;
        }

        const flowData = { nodes, edges };
        // Calcular steps baseado no número de nós (menos trigger)
        const stepsCount = nodes.filter(n => !TRIGGER_KEYS.includes(n.data.type)).length;
        // Pegar o valor do trigger
        const triggerNode = nodes.find(n => TRIGGER_KEYS.includes(n.data.type));
        const triggerValue = triggerNode ? triggerNode.data.value : 'Manual';

        const newWorkflow: Workflow = {
            id: editingId || Date.now(),
            name: newName,
            status: 'active',
            triggers: triggerValue,
            steps: stepsCount,
            enrolled: editingId ? (workflows.find((w: Workflow) => w.id === editingId)?.enrolled || 0) : 0,
            conversion: editingId ? (workflows.find((w: Workflow) => w.id === editingId)?.conversion || '-') : '-',
            flowData
        };

        saveMutation.mutate(newWorkflow);
    };

    const handleToggleStatus = (id: number) => {
        toggleStatusMutation.mutate(id);
    };

    // --- RENDER HELPERS ---

    const getTemplateIcon = (iconType: string) => {
        switch (iconType) {
            case 'user-plus': return <UserPlus className="text-green-600" size={24} />;
            case 'clock': return <Clock className="text-orange-600" size={24} />;
            case 'zap': return <Zap className="text-yellow-600" size={24} />;
            case 'git-branch': return <GitBranch className="text-purple-600" size={24} />;
            case 'message-square': return <MessageSquare className="text-blue-600" size={24} />;
            case 'alert-circle': return <AlertCircle className="text-red-600" size={24} />;
            case 'shopping-cart': return <ShoppingCart className="text-indigo-600" size={24} />;
            case 'calendar': return <Calendar className="text-cyan-600" size={24} />;
            default: return <Zap className="text-gray-600" size={24} />;
        }
    };

    // --- VIEWS ---

    if (view === 'templates') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Templates de Automação</h2>
                        <p className="text-sm text-gray-500">Escolha um template pronto para começar rapidamente</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template: WorkflowTemplate) => (
                        <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {getTemplateIcon(template.iconType)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{template.category}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                            <button
                                onClick={() => handleUseTemplate(template)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Copy size={16} /> Usar Template
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Nome da Automação"
                                className="text-xl font-bold text-gray-800 border-none focus:ring-0 p-0 placeholder-gray-400"
                            />
                            <p className="text-xs text-gray-500">Arraste os elementos para construir seu fluxo</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setView('list')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                            <Save size={18} /> Salvar Fluxo
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto shrink-0">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Elementos</h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-medium text-gray-400 mb-2">Gatilhos</h4>
                                {Object.entries(NODE_TYPES_CONFIG).filter(([key]) => TRIGGER_KEYS.includes(key)).map(([type, config]) => (
                                    <div
                                        key={type}
                                        className={`bg-white p-3 rounded-lg border shadow-sm cursor-grab hover:shadow-md flex items-center gap-3 mb-2 ${config.color.split(' ')[1]}`}
                                        onDragStart={(event) => event.dataTransfer.setData('application/reactflow', type)}
                                        draggable
                                    >
                                        <div className="text-gray-600">{config.icon}</div>
                                        <span className="text-sm font-medium text-gray-700">{config.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <h4 className="text-xs font-medium text-gray-400 mb-2">Ações</h4>
                                {Object.entries(NODE_TYPES_CONFIG).filter(([key]) => !TRIGGER_KEYS.includes(key)).map(([type, config]) => (
                                    <div
                                        key={type}
                                        className={`bg-white p-3 rounded-lg border shadow-sm cursor-grab hover:shadow-md flex items-center gap-3 mb-2 ${config.color.split(' ')[1]}`} // Usando a cor da borda
                                        onDragStart={(event) => event.dataTransfer.setData('application/reactflow', type)}
                                        draggable
                                    >
                                        <div className="text-gray-600">{config.icon}</div>
                                        <span className="text-sm font-medium text-gray-700">{config.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* React Flow Canvas */}
                    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                        <ReactFlowProvider>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onInit={setReactFlowInstance}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onNodeClick={onNodeClick}
                                nodeTypes={nodeTypes}
                                fitView
                                snapToGrid
                            >
                                <Background color="#f1f5f9" gap={16} />
                                <Controls />
                                <MiniMap />
                            </ReactFlow>
                        </ReactFlowProvider>
                    </div>

                    {/* Properties Panel */}
                    {selectedNodeId && (
                        <div className="w-72 bg-white border-l border-gray-200 p-4 shadow-xl z-10 shrink-0">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800">Propriedades</h3>
                                <button onClick={() => setSelectedNodeId(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Configuração do Passo</label>
                                    {nodes.find(n => n.id === selectedNodeId)?.data.type === 'email' ? (
                                        <RichTextEditor
                                            value={nodeValue}
                                            onChange={updateNodeValue}
                                        />
                                    ) : (
                                        <textarea
                                            value={nodeValue}
                                            onChange={(e) => updateNodeValue(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="Digite os detalhes desta ação..."
                                        />
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={deleteSelectedNode}
                                        className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Excluir Passo
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Automação de Marketing <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2 align-middle">{COMPONENT_VERSIONS.Automation}</span></h2>
                    <p className="text-sm text-gray-500">Gerencie seus fluxos de trabalho e gatilhos automatizados.</p>
                </div>
                <div className="flex gap-3">
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
};
