import React, { useState, useEffect } from 'react';
import { X, Save, Clock, CheckSquare, Users, FileText, Flag, MessageSquare, Paperclip, ChevronDown, Plus, Trash2, Layout, ListChecks, Tag, CheckCircle2, Layers, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Task } from '../types';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: Partial<Task>) => Promise<void>;
    task?: Task; // If provided, Edit mode
    initialStatus?: string;
    projectId?: number;
    users?: { id: number; name: string; avatar_url?: string }[];
    projects?: { id: number; name: string }[];
}

const TaskModal: React.FC<TaskModalProps> = ({
    isOpen, onClose, onSave, task,
    initialStatus = 'todo', projectId, users = [], projects = []
}) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('identity');
    const [loading, setLoading] = useState(false);
    const [checklistInput, setChecklistInput] = useState('');

    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        task_type: 'content',
        workspace: '',
        channel: '',
        stage: '',
        effort_time: '',
        origin: '',
        squad: '',
        tags: [],

        // Detailed
        reference_code: '',
        collaborators_ids: [],
        approvers_ids: [],
        stakeholders_ids: [],
        percent_complete: 0,
        checklist: [],
        deliverable_format: '',
        technical_specs: '',
        brand_guidelines: '',
        briefing_link: '',
        visual_references: '',
        support_materials: '',
        final_delivery_link: '',
        feedback: ''
    });

    useEffect(() => {
        if (task) {
            setFormData({
                ...task,
                checklist: typeof task.checklist === 'string' ? JSON.parse(task.checklist) : task.checklist || [],
                tags: Array.isArray(task.tags) ? task.tags : [],
                collaborators_ids: task.collaborators_ids || [],
                approvers_ids: task.approvers_ids || [],
                stakeholders_ids: task.stakeholders_ids || [],
            });
        } else {
            setFormData({
                title: '',
                status: initialStatus as any,
                priority: 'medium',
                project_id: projectId
            });
        }
    }, [task, initialStatus, projectId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (name: string, value: any[]) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const addChecklistItem = () => {
        if (!checklistInput.trim()) return;
        const newItem = { id: Date.now().toString(), text: checklistInput, completed: false };
        setFormData(prev => ({
            ...prev,
            checklist: [...(prev.checklist || []), newItem]
        }));
        setChecklistInput('');
    };

    const toggleChecklist = (id: string) => {
        setFormData(prev => ({
            ...prev,
            checklist: prev.checklist?.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save task", error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'identity', label: 'Identificação', icon: FileText },
        { id: 'responsibility', label: 'Responsabilidade', icon: Users },
        { id: 'specs', label: 'Especificações', icon: Layers },
        { id: 'progress', label: 'Progresso', icon: CheckSquare },
        { id: 'delivery', label: 'Entrega', icon: Flag },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                            {task ? `Editar Tarefa ${task.reference_code ? `(${task.reference_code})` : ''}` : 'Nova Tarefa'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Gerencie detalhes, responsáveis e entregáveis.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs & Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-56 bg-gray-50 border-r border-gray-100 p-3 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">

                            {/* IDENTITY */}
                            {activeTab === 'identity' && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título da Tarefa</label>
                                        <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Criar Post Carrossel" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
                                            <select name="project_id" value={formData.project_id || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                                <option value="">Sem Projeto</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tarefa</label>
                                            <select name="task_type" value={formData.task_type || 'content'} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                                <option value="content">Conteúdo</option>
                                                <option value="design">Design</option>
                                                <option value="video">Vídeo</option>
                                                <option value="strategy">Estratégia</option>
                                                <option value="dev">Desenvolvimento</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="w-full px-4 py-2 border rounded-lg" placeholder="Detalhes do que precisa ser feito..." />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                            <select name="priority" value={formData.priority || 'medium'} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                                <option value="low">Baixa</option>
                                                <option value="medium">Média</option>
                                                <option value="high">Alta</option>
                                                <option value="urgent">Urgente</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <select name="status" value={formData.status || 'todo'} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                                <option value="todo">A Fazer</option>
                                                <option value="in_progress">Em Progresso</option>
                                                <option value="review">Em Revisão</option>
                                                <option value="done">Concluído</option>
                                                <option value="blocked">Bloqueado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ref. Code (ID)</label>
                                            <input type="text" name="reference_code" value={formData.reference_code || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="PROJ-001" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* RESPONSIBILITY */}
                            {activeTab === 'responsibility' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Responsável Principal (Assignee)</label>
                                        <select name="assignee_id" value={formData.assignee_id || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-blue-50/50 border-blue-200">
                                            <option value="">Selecione...</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Colaboradores Envolvidos</label>
                                        <div className="p-3 border rounded-lg h-32 overflow-y-auto grid grid-cols-2 gap-2">
                                            {users.map(u => (
                                                <label key={u.id} className="flex items-center space-x-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.collaborators_ids?.includes(u.id)}
                                                        onChange={(e) => {
                                                            const current = formData.collaborators_ids || [];
                                                            const updated = e.target.checked
                                                                ? [...current, u.id]
                                                                : current.filter(id => id !== u.id);
                                                            handleArrayChange('collaborators_ids', updated);
                                                        }}
                                                        className="rounded text-blue-600"
                                                    />
                                                    <span>{u.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 flex items-center gap-3">
                                        <Zap className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <h4 className="text-sm font-bold text-purple-800">Elite Brain Integration</h4>
                                            <p className="text-xs text-purple-600">Esta tarefa será indexada pelo sistema para dar contexto à IA.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SPECS */}
                            {activeTab === 'specs' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Canal de Marketing</label>
                                            <input type="text" name="channel" value={formData.channel || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="Instagram, Email..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Formato de Entrega</label>
                                            <input type="text" name="deliverable_format" value={formData.deliverable_format || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="Reels, PDF, PNG..." />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Especificações Técnicas</label>
                                        <textarea name="technical_specs" value={formData.technical_specs || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="Dimensões 1080x1920, max 60s, color profile sRGB..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Diretrizes de Marca</label>
                                        <textarea name="brand_guidelines" value={formData.brand_guidelines || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="Tom de voz divertido, cores vibrantes..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Links de Assets/Briefing</label>
                                        <input type="text" name="briefing_link" value={formData.briefing_link || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg mb-2" placeholder="URL do Briefing" />
                                        <input type="text" name="support_materials" value={formData.support_materials || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="URL de Materiais de Apoio" />
                                    </div>
                                </div>
                            )}

                            {/* PROGRESS */}
                            {activeTab === 'progress' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Porcentagem Concluída: {formData.percent_complete}%</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            name="percent_complete"
                                            value={formData.percent_complete || 0}
                                            onChange={handleChange}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="border rounded-lg p-4 bg-gray-50">
                                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <CheckSquare className="w-4 h-4" /> Checklist
                                        </h3>
                                        <div className="space-y-2 mb-3">
                                            {formData.checklist?.map(item => (
                                                <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-100">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.completed}
                                                        onChange={() => toggleChecklist(item.id)}
                                                        className="rounded text-blue-600"
                                                    />
                                                    <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>{item.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={checklistInput}
                                                onChange={(e) => setChecklistInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                                                placeholder="Adicionar sub-tarefa..."
                                                className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                                            />
                                            <button type="button" onClick={addChecklistItem} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">+</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-red-700 mb-1">Bloqueios / Impedimentos</label>
                                        <textarea name="blockers" value={formData.blockers || ''} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-red-200 rounded-lg bg-red-50 focus:ring-red-500" placeholder="O que está impedindo o progresso?" />
                                    </div>
                                </div>
                            )}

                            {/* DELIVERY */}
                            {activeTab === 'delivery' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                                        <label className="block text-sm font-bold text-green-800 mb-2">Link da Entrega Final</label>
                                        <input type="text" name="final_delivery_link" value={formData.final_delivery_link || ''} onChange={handleChange} className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-green-500" placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Recebido</label>
                                        <textarea name="feedback" value={formData.feedback || ''} onChange={handleChange} rows={4} className="w-full px-4 py-2 border rounded-lg" placeholder="Comentários sobre a entrega..." />
                                    </div>
                                </div>
                            )}

                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg">
                        {loading ? 'Salvando...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Salvar Tarefa
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TaskModal;
