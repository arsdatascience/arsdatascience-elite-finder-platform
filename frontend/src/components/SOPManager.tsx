import React, { useState, useEffect } from 'react';
import { Plus, Folder, Clock, List, ArrowRight, Trash2, Save, X } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { SOPTemplate, SOPTemplateItem } from '../types';

const SOPManager: React.FC = () => {
    const [templates, setTemplates] = useState<SOPTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<SOPTemplate | null>(null);
    const [items, setItems] = useState<SOPTemplateItem[]>([]);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const data = await apiClient.templates.list();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTemplate({
            id: 0,
            name: 'New Template',
            description: '',
            category: 'General',
            is_active: true
        });
        setItems([]);
    };

    const handleEdit = async (template: SOPTemplate) => {
        try {
            const details = await apiClient.templates.getDetails(template.id);
            setEditingTemplate(details);
            setItems(details.items || []);
        } catch (error) {
            console.error('Failed to load template details', error);
        }
    };

    const handleSave = async () => {
        if (!editingTemplate) return;

        try {
            const payload = { ...editingTemplate, items };
            if (editingTemplate.id === 0) {
                await apiClient.templates.create(payload);
            } else {
                await apiClient.templates.update(editingTemplate.id, payload);
            }
            setEditingTemplate(null);
            loadTemplates();
        } catch (error) {
            console.error('Failed to save template', error);
            alert('Failed to save template');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await apiClient.templates.delete(id);
            loadTemplates();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    // Item Management (Simple Array manipulation for now)
    const addItem = () => {
        setItems([...items, { title: 'New Step', description: '', duration_days: 1, order_index: items.length }]);
    };

    const updateItem = (index: number, field: keyof SOPTemplateItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    if (editingTemplate) {
        return (
            <div className="p-6 text-white max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <List className="text-emerald-500" />
                        {editingTemplate.id === 0 ? 'Create Process' : 'Edit Process'}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2">
                            <Save size={18} /> Save Template
                        </button>
                    </div>
                </div>

                <div className="bg-[#111] p-6 rounded-xl border border-gray-800 mb-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Process Name</label>
                            <input
                                type="text"
                                value={editingTemplate.name}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                className="w-full bg-black border border-gray-800 rounded p-2 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Category</label>
                            <input
                                type="text"
                                value={editingTemplate.category}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                                className="w-full bg-black border border-gray-800 rounded p-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                        <textarea
                            value={editingTemplate.description}
                            onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                            className="w-full bg-black border border-gray-800 rounded p-2 h-20"
                        />
                    </div>
                </div>

                <div className="bg-[#111] p-6 rounded-xl border border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Process Steps</h3>
                        <button onClick={addItem} className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1">
                            <Plus size={16} /> Add Step
                        </button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-3 items-start bg-black/50 p-3 rounded border border-gray-800 group">
                                <div className="pt-2 text-gray-500 text-sm">#{index + 1}</div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={item.title}
                                            onChange={(e) => updateItem(index, 'title', e.target.value)}
                                            placeholder="Step title"
                                            className="flex-1 bg-transparent border-b border-gray-800 focus:border-emerald-500 outline-none p-1"
                                        />
                                        <div className="flex items-center gap-1 text-gray-400 bg-gray-900 rounded px-2">
                                            <Clock size={14} />
                                            <input
                                                type="number"
                                                value={item.duration_days}
                                                onChange={(e) => updateItem(index, 'duration_days', parseInt(e.target.value))}
                                                className="w-12 bg-transparent text-center outline-none"
                                            />
                                            <span className="text-xs">days</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        placeholder="Description (optional)"
                                        className="w-full bg-transparent text-sm text-gray-500 outline-none"
                                    />
                                </div>
                                <button onClick={() => removeItem(index)} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-gray-800 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {items.length === 0 && (
                            <div className="text-center py-8 text-gray-600 italic">No steps defined yet. Add one to get started.</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 text-white h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">Process & Models</h1>
                    <p className="text-gray-400">Manage Standard Operating Procedures (SOPs)</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                    <Plus size={20} /> New Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-[#111] hover:bg-[#161616] border border-gray-800 hover:border-emerald-500/30 rounded-xl p-6 transition-all group cursor-pointer relative" onClick={() => handleEdit(template)}>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }} className="text-gray-500 hover:text-red-500">
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                            <Folder size={24} />
                        </div>

                        <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-4 h-10">{template.description || 'No description provided.'}</p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wider bg-gray-900 w-fit px-2 py-1 rounded">
                            <ArrowRight size={12} /> {template.category || 'General'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SOPManager;
