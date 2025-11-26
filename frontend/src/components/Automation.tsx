import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Copy, Edit, Trash2, Save, X
} from 'lucide-react';
import { COMPONENT_VERSIONS } from '../componentVersions';
import { RichTextEditor } from './RichTextEditor';

// --- TYPES ---

interface WorkflowStep {
    id: string;
    type: 'wait' | 'email' | 'whatsapp' | 'notification' | 'sms' | 'tag' | 'owner' | 'webhook' | 'trigger';
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
    stepsList?: WorkflowStep[];
    flowData?: {
        nodes: Node[];
        edges: Edge[];
    };
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

// --- CONSTANTS & MOCKS ---


const NODE_TYPES_CONFIG = {
    trigger: { label: 'Gatilho', icon: <Zap size={16} />, color: 'bg-yellow-100 border-yellow-300' },
    wait: { label: 'Aguardar', icon: <Clock size={16} />, color: 'bg-gray-100 border-gray-300' },
    email: { label: 'Email', icon: <Mail size={16} />, color: 'bg-blue-100 border-blue-300' },
    whatsapp: { label: 'WhatsApp', icon: <MessageSquare size={16} />, color: 'bg-green-100 border-green-300' },
    notification: { label: 'Notificação', icon: <AlertCircle size={16} />, color: 'bg-orange-100 border-orange-300' },
    sms: { label: 'SMS', icon: <Smartphone size={16} />, color: 'bg-purple-100 border-purple-300' },
    tag: { label: 'Tag', icon: <Tag size={16} />, color: 'bg-pink-100 border-pink-300' },
    owner: { label: 'Responsável', icon: <UserPlus size={16} />, color: 'bg-indigo-100 border-indigo-300' },
    webhook: { label: 'Webhook', icon: <Globe size={16} />, color: 'bg-teal-100 border-teal-300' },
};

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
            {data.type !== 'trigger' && (
                <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-400" />
            )}
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

// --- TEMPLATES DATA ---
// (Mantendo os templates originais mas simplificados para o exemplo)
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'new_lead_nurture',
        name: 'Nutrição de Novo Lead',
        description: 'Sequência automática para engajar novos leads',
        category: 'Vendas',
        trigger: 'Novo Lead Criado',
        iconType: 'user-plus',
        steps: [
            { type: 'wait', value: '5 minutos' },
            { type: 'email', value: 'Email de Boas-vindas' },
            { type: 'wait', value: '1 dia' },
            { type: 'whatsapp', value: 'Olá! Posso ajudar?' }
        ]
    },
    // ... outros templates poderiam ser adicionados aqui
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
        flowData: {
            nodes: [
                { id: '1', type: 'custom', position: { x: 250, y: 0 }, data: { type: 'trigger', value: 'Novo Lead Criado' } },
                { id: '2', type: 'custom', position: { x: 250, y: 100 }, data: { type: 'wait', value: '5 minutos' } },
                { id: '3', type: 'custom', position: { x: 250, y: 200 }, data: { type: 'email', value: 'Email de Boas-vindas' } },
                { id: '4', type: 'custom', position: { x: 250, y: 300 }, data: { type: 'whatsapp', value: 'Olá! Posso ajudar?' } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
                { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
                { id: 'e3-4', source: '3', target: '4', type: 'smoothstep' }
            ]
        }
    }
];

export const Automation: React.FC = () => {
    const [view, setView] = useState<'list' | 'create' | 'templates'>('list');
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);

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

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            // Simulação de fetch
            setWorkflows(INITIAL_WORKFLOWS);
        } catch (error) {
            console.error('Error fetching workflows:', error);
        }
    };

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
                    value: type === 'trigger' ? 'Novo Gatilho' : `Novo ${NODE_TYPES_CONFIG[type as keyof typeof NODE_TYPES_CONFIG].label}`
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
        const stepsCount = nodes.filter(n => n.data.type !== 'trigger').length;
        // Pegar o valor do trigger
        const triggerNode = nodes.find(n => n.data.type === 'trigger');
        const triggerValue = triggerNode ? triggerNode.data.value : 'Manual';

        const newWorkflow: Workflow = {
            id: editingId || Date.now(),
            name: newName,
            status: 'active',
            triggers: triggerValue,
            steps: stepsCount,
            enrolled: editingId ? (workflows.find(w => w.id === editingId)?.enrolled || 0) : 0,
            conversion: editingId ? (workflows.find(w => w.id === editingId)?.conversion || '-') : '-',
            flowData
        };

        if (editingId) {
            setWorkflows(workflows.map(w => w.id === editingId ? newWorkflow : w));
        } else {
            setWorkflows([newWorkflow, ...workflows]);
        }

        setView('list');
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
                    {WORKFLOW_TEMPLATES.map(template => (
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
                                <div
                                    className="bg-white p-3 rounded-lg border border-yellow-200 shadow-sm cursor-grab hover:shadow-md flex items-center gap-3 mb-2"
                                    onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'trigger')}
                                    draggable
                                >
                                    <Zap size={16} className="text-yellow-500" />
                                    <span className="text-sm font-medium text-gray-700">Gatilho</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-medium text-gray-400 mb-2">Ações</h4>
                                {Object.entries(NODE_TYPES_CONFIG).filter(([key]) => key !== 'trigger').map(([type, config]) => (
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

            <div className="grid grid-cols-1 gap-4">
                {workflows.map(workflow => (
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
                                <button className={`p-2 rounded-lg border ${workflow.status === 'active' ? 'border-orange-300 text-orange-600 hover:bg-orange-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                                    {workflow.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
