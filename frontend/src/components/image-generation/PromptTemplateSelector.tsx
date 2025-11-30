import React, { useState } from 'react';
import { PROMPT_TEMPLATES, PromptTemplate } from '../../lib/prompt-templates';
import { BookTemplate, X, Check } from 'lucide-react';

interface PromptTemplateSelectorProps {
    onSelect: (template: PromptTemplate) => void;
}

export const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = ['all', ...Array.from(new Set(PROMPT_TEMPLATES.map(t => t.category)))];

    const filteredTemplates = selectedCategory === 'all'
        ? PROMPT_TEMPLATES
        : PROMPT_TEMPLATES.filter(t => t.category === selectedCategory);

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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BookTemplate className="text-purple-600" />
                        Templates de Prompt
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 overflow-x-auto">
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${selectedCategory === cat
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat === 'all' ? 'Todos' : cat.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => {
                                onSelect(template);
                                setIsOpen(false);
                            }}
                            className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-800 group-hover:text-purple-700">{template.name}</h4>
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
                                    {template.category}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                            <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 font-mono line-clamp-2 group-hover:bg-white border border-transparent group-hover:border-purple-100">
                                {template.prompt}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
