import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Plus, LayoutTemplate, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Template {
    id: number;
    template_id: string;
    template_name: string;
    template_description: string;
    category: string;
    created_at: string;
}

export const TemplateManager: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates`);
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm('Tem certeza que deseja excluir este template?')) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates/${templateId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setTemplates(prev => prev.filter(t => t.template_id !== templateId));
                alert('Template excluído com sucesso!');
            } else {
                alert('Erro ao excluir template');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao excluir template');
        }
    };

    const handleUseTemplate = (templateId: string) => {
        // Redirecionar para o AgentBuilder com o ID do template na URL ou State
        // Por enquanto, vamos apenas logar, mas a ideia é carregar a config
        navigate(`/agent-builder?template=${templateId}`);
    };

    const filteredTemplates = templates.filter(t =>
        t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <LayoutTemplate className="text-purple-600" /> Meus Templates
                        </h1>
                        <p className="text-gray-500 mt-2">Gerencie seus modelos de agentes personalizados.</p>
                    </div>
                    <button
                        onClick={() => navigate('/agent-builder')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2"
                    >
                        <Plus size={20} /> Novo Template
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex items-center gap-3">
                    <Search className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar templates..."
                        className="flex-1 outline-none text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map(template => (
                            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${template.category === 'sales' ? 'bg-green-100 text-green-700' :
                                        template.category === 'support' ? 'bg-primary-100 text-primary-700' :
                                            'bg-purple-100 text-purple-700'
                                        }`}>
                                        {template.category}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(template.template_id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                        title="Excluir Template"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-2">{template.template_name}</h3>
                                <p className="text-sm text-gray-500 mb-6 flex-1">{template.template_description || 'Sem descrição.'}</p>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleUseTemplate(template.template_id)}
                                        className="w-full py-2 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Copy size={16} /> Usar este Template
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredTemplates.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-400">
                                <LayoutTemplate size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Nenhum template encontrado.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
