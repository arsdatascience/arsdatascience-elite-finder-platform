import React, { useState, useEffect } from 'react';
import { PROMPT_TEMPLATES, PromptTemplate } from '../../lib/prompt-templates';
import { BookTemplate, X, Plus, Trash2, Save } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface PromptTemplateSelectorProps {
    onSelect: (template: PromptTemplate) => void;
}

const categoryLabels: Record<string, string> = {
    'health-wellness': 'Saúde e Bem-estar',
    'education': 'Educação',
    'food-beverage': 'Alimentos e Bebidas',
    'legal-financial': 'Jurídico e Financeiro',
    'fashion-beauty': 'Moda e Beleza',
    'technology': 'Tecnologia',
    'construction-services': 'Construção e Serviços',
    'events-entertainment': 'Eventos e Entretenimento',
    'automotive': 'Automotivo',
    'pets': 'Pets',
    'marketing-communication': 'Marketing e Comunicação',
    'custom': 'Personalizado',
    'all': 'Todos',
    // Traduções para categorias legadas ou extras
    'sales': 'Vendas',
    'support': 'Suporte',
    'technical': 'Técnico',
    'whatsapp': 'WhatsApp',
    'automation': 'Automação',
    'legal': 'Jurídico',
    'marketing': 'Marketing'
};

export const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [customTemplates, setCustomTemplates] = useState<PromptTemplate[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', description: '', prompt: '', negativePrompt: '', category: 'custom' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadCustomTemplates();
        }
    }, [isOpen]);

    const loadCustomTemplates = async () => {
        try {
            const data = await apiClient.promptTemplates.list();
            const formatted = data.map((t: any) => ({ ...t, id: String(t.id) }));
            setCustomTemplates(formatted);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const created = await apiClient.promptTemplates.create(newTemplate);
            const formatted = { ...created, id: String(created.id) };
            setCustomTemplates([formatted, ...customTemplates]);
            setShowCreateForm(false);
            setNewTemplate({ name: '', description: '', prompt: '', negativePrompt: '', category: 'custom' });
            setSelectedCategory('custom');
        } catch (error) {
            alert('Erro ao criar template');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Deletar template?')) return;
        try {
            await apiClient.promptTemplates.delete(Number(id));
            setCustomTemplates(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Erro ao deletar:', error);
        }
    };

    // Filtrar templates inválidos (sem nome ou prompt) e combinar
    const allTemplates = [...customTemplates, ...PROMPT_TEMPLATES].filter(t => t.name && t.name.trim() !== '' && t.prompt);
    const uniqueCategories = Array.from(new Set(allTemplates.map(t => t.category)));

    // Ordenar categorias: 'all', depois as predefinidas na ordem do objeto labels, depois outras (custom)
    const sortedCategories = ['all', ...Object.keys(categoryLabels).filter(k => k !== 'all' && uniqueCategories.includes(k)), ...uniqueCategories.filter(k => !categoryLabels[k] && k !== 'all')];

    const filteredTemplates = selectedCategory === 'all'
        ? allTemplates
        : allTemplates.filter(t => t.category === selectedCategory);

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
            >
                <BookTemplate size={14} />
                Usar Template
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BookTemplate className="text-purple-600" />
                        Templates de Prompt
                    </h3>
                    <div className="flex gap-2">
                        {!showCreateForm && (
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Plus size={14} /> Novo Template
                            </button>
                        )}
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Categorias */}
                    <div className="w-64 border-r border-gray-100 p-4 overflow-y-auto hidden md:block bg-gray-50/50 custom-scrollbar">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Categorias</h4>
                        <div className="space-y-1">
                            {sortedCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedCategory === cat
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {categoryLabels[cat] || cat.replace(/-/g, ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conteúdo Principal */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Mobile Categories */}
                        <div className="md:hidden p-2 border-b border-gray-100 overflow-x-auto whitespace-nowrap custom-scrollbar">
                            <div className="flex gap-2">
                                {sortedCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${selectedCategory === cat ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
                                    >
                                        {categoryLabels[cat] || cat.replace(/-/g, ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/30">
                            {showCreateForm ? (
                                <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-semibold text-gray-800 text-lg">Criar Novo Template</h4>
                                        <button onClick={() => setShowCreateForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                                    </div>
                                    <form onSubmit={handleCreate} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                            <input
                                                type="text"
                                                required
                                                value={newTemplate.name}
                                                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                                placeholder="Ex: Retrato Cyberpunk"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                            <select
                                                value={newTemplate.category}
                                                onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                            >
                                                <option value="custom">Personalizado</option>
                                                {Object.entries(categoryLabels).filter(([k]) => k !== 'all' && k !== 'custom').map(([k, v]) => (
                                                    <option key={k} value={k}>{v}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                            <input
                                                type="text"
                                                value={newTemplate.description}
                                                onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                                placeholder="Breve descrição do estilo"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                                            <textarea
                                                required
                                                value={newTemplate.prompt}
                                                onChange={e => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                                                className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-all"
                                                placeholder="O prompt base. Use [SUBJECT] para onde o usuário irá inserir o tema."
                                            />
                                            <p className="text-xs text-gray-400 mt-1">Dica: Use [SUBJECT] como placeholder.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Negativo (Opcional)</label>
                                            <textarea
                                                value={newTemplate.negativePrompt}
                                                onChange={e => setNewTemplate({ ...newTemplate, negativePrompt: e.target.value })}
                                                className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-all"
                                                placeholder="O que evitar na imagem..."
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex justify-center items-center gap-2 transition-colors shadow-sm"
                                        >
                                            {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <Save size={18} />}
                                            Salvar Template
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredTemplates.length > 0 ? filteredTemplates.map(template => (
                                        <div
                                            key={template.id}
                                            onClick={() => {
                                                onSelect(template);
                                                setIsOpen(false);
                                            }}
                                            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all group relative flex flex-col h-full"
                                        >
                                            {customTemplates.some(ct => ct.id === template.id) && (
                                                <button
                                                    onClick={(e) => handleDelete(e, template.id)}
                                                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                                                    title="Excluir Template"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}

                                            <div className="flex justify-between items-start mb-2 pr-6">
                                                <h4 className="font-semibold text-gray-800 group-hover:text-purple-700 text-sm line-clamp-1" title={template.name}>{template.name}</h4>
                                            </div>

                                            <div className="mb-3">
                                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize border border-gray-200 inline-block">
                                                    {categoryLabels[template.category] || template.category}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2.5em]">{template.description}</p>

                                            <div
                                                className="bg-gray-50 p-2.5 rounded-lg text-[11px] text-gray-600 font-mono border border-gray-100 group-hover:border-purple-100 flex-1 overflow-hidden relative"
                                                title={template.prompt}
                                            >
                                                <div className="line-clamp-4 group-hover:line-clamp-none transition-all">
                                                    {template.prompt}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full text-center py-12 text-gray-400">
                                            <BookTemplate size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>Nenhum template encontrado nesta categoria.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
