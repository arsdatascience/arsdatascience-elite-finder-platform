import React, { useState, useEffect } from 'react';
import { PROMPT_TEMPLATES, PromptTemplate } from '../../lib/prompt-templates';
import { BookTemplate, X, Check, Plus, Trash2, Save } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface PromptTemplateSelectorProps {
    onSelect: (template: PromptTemplate) => void;
}

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
            // Converter IDs numéricos para string para compatibilidade
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
            setSelectedCategory('custom'); // Mudar para a categoria do novo template
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

    const allTemplates = [...customTemplates, ...PROMPT_TEMPLATES];
    // Garantir categorias únicas e adicionar 'custom' se não existir
    const uniqueCategories = Array.from(new Set(allTemplates.map(t => t.category)));
    const categories = ['all', ...uniqueCategories.sort()];

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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
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
                    <div className="w-48 border-r border-gray-100 p-4 overflow-y-auto hidden md:block bg-gray-50/50">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Categorias</h4>
                        <div className="space-y-1">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${selectedCategory === cat
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {cat === 'all' ? 'Todos' : cat.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conteúdo Principal */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Mobile Categories */}
                        <div className="md:hidden p-2 border-b border-gray-100 overflow-x-auto whitespace-nowrap">
                            <div className="flex gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${selectedCategory === cat ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
                                    >
                                        {cat === 'all' ? 'Todos' : cat.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {showCreateForm ? (
                                <div className="max-w-lg mx-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold text-gray-800">Criar Novo Template</h4>
                                        <button onClick={() => setShowCreateForm(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                                    </div>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                                            <input
                                                type="text"
                                                required
                                                value={newTemplate.name}
                                                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                placeholder="Ex: Retrato Cyberpunk"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                                            <select
                                                value={newTemplate.category}
                                                onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            >
                                                <option value="custom">Personalizado</option>
                                                <option value="photography">Fotografia</option>
                                                <option value="art">Arte</option>
                                                <option value="marketing">Marketing</option>
                                                <option value="social-media">Redes Sociais</option>
                                                <option value="architecture">Arquitetura</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                                            <input
                                                type="text"
                                                value={newTemplate.description}
                                                onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                placeholder="Breve descrição do estilo"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Prompt</label>
                                            <textarea
                                                required
                                                value={newTemplate.prompt}
                                                onChange={e => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                                                className="w-full h-24 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                                placeholder="O prompt base. Use [SUBJECT] para onde o usuário irá inserir o tema."
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">Dica: Use [SUBJECT] como placeholder.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Prompt Negativo (Opcional)</label>
                                            <textarea
                                                value={newTemplate.negativePrompt}
                                                onChange={e => setNewTemplate({ ...newTemplate, negativePrompt: e.target.value })}
                                                className="w-full h-16 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                                placeholder="O que evitar na imagem..."
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex justify-center items-center gap-2"
                                        >
                                            {loading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Save size={16} />}
                                            Salvar Template
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {filteredTemplates.length > 0 ? filteredTemplates.map(template => (
                                        <div
                                            key={template.id}
                                            onClick={() => {
                                                onSelect(template);
                                                setIsOpen(false);
                                            }}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all group relative bg-white shadow-sm hover:shadow-md"
                                        >
                                            {/* Botão de deletar apenas para templates customizados (que têm ID numérico convertido para string, geralmente curtos, mas melhor verificar se está na lista customTemplates) */}
                                            {customTemplates.some(ct => ct.id === template.id) && (
                                                <button
                                                    onClick={(e) => handleDelete(e, template.id)}
                                                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Excluir Template"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}

                                            <div className="flex justify-between items-start mb-2 pr-6">
                                                <h4 className="font-semibold text-gray-800 group-hover:text-purple-700 text-sm">{template.name}</h4>
                                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize border border-gray-200">
                                                    {template.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{template.description}</p>
                                            <div className="bg-gray-50 p-2.5 rounded text-[11px] text-gray-600 font-mono line-clamp-3 group-hover:bg-white border border-gray-100 group-hover:border-purple-100">
                                                {template.prompt}
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
