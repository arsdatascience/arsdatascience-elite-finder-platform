import React, { useEffect, useState } from 'react';
import { X, Clock, ChevronRight } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface PromptHistoryProps {
    onSelect: (prompt: string) => void;
    onClose: () => void;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({ onSelect, onClose }) => {
    const [prompts, setPrompts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const res = await apiClient.imageGeneration.getRecentPrompts();
                if (res.success) {
                    setPrompts(res.prompts);
                }
            } catch (error) {
                console.error('Failed to load prompt history', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPrompts();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-700" />
                        <h2 className="text-xl font-bold text-gray-800">Histórico de Prompts</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                        </div>
                    ) : prompts.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Nenhum histórico encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {prompts.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSelect(prompt)}
                                    className="w-full text-left p-4 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group flex items-start gap-3"
                                >
                                    <div className="mt-1 bg-gray-100 p-1.5 rounded-md group-hover:bg-gray-200 transition-colors">
                                        <Clock className="w-3 h-3 text-gray-700" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-700 text-sm line-clamp-2 group-hover:text-gray-900 font-medium">{prompt}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-1" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t text-center text-xs text-gray-500 rounded-b-xl">
                    Mostrando os últimos 20 prompts utilizados
                </div>
            </div>
        </div>
    );
};

export default PromptHistory;
