import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { GeneratedImage } from '../../types';
import { Edit2, RefreshCw } from 'lucide-react';

interface ImageEditorProps {
    originalImage: GeneratedImage;
    onEdited?: (editedImage: GeneratedImage) => void;
    onError?: (error: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ originalImage, onEdited, onError }) => {
    const [prompt, setPrompt] = useState('');
    const [strength, setStrength] = useState(0.75);
    const [loading, setLoading] = useState(false);
    const [editedImage, setEditedImage] = useState<GeneratedImage | null>(null);

    const handleEdit = async () => {
        if (!prompt.trim()) {
            if (onError) onError('Digite um prompt para editar');
            return;
        }

        setLoading(true);
        try {
            const result = await apiClient.imageGeneration.edit({
                imageUrl: originalImage.url,
                prompt: prompt.trim(),
                strength,
            });

            if (result.success) {
                setEditedImage(result.data);
                if (onEdited) onEdited(result.data);
            } else {
                if (onError) onError('Falha ao editar imagem');
            }
        } catch (err: any) {
            console.error(err);
            if (onError) onError(err.response?.data?.error || 'Erro ao editar imagem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Editor de Imagem (Img2Img)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="text-sm font-medium mb-2">Original</h4>
                    <img
                        src={originalImage.url}
                        alt="Original"
                        className="w-full rounded-lg border border-gray-200"
                    />
                </div>

                <div>
                    <h4 className="text-sm font-medium mb-2">
                        {editedImage ? 'Editada' : 'Preview'}
                    </h4>
                    {editedImage ? (
                        <img
                            src={editedImage.url}
                            alt="Editada"
                            className="w-full rounded-lg border border-gray-200"
                        />
                    ) : (
                        <div className="w-full aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                            Imagem editada aparecerá aqui
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Novo Prompt (como modificar a imagem)
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: make it more vibrant, add sunset colors, change to winter scene"
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        maxLength={500}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Força da Edição: {(strength * 100).toFixed(0)}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={strength * 100}
                        onChange={(e) => setStrength(parseInt(e.target.value) / 100)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Mínimo (mantém original)</span>
                        <span>Máximo (transformação total)</span>
                    </div>
                </div>

                <button
                    onClick={handleEdit}
                    disabled={loading || !prompt.trim()}
                    className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Editando...
                        </>
                    ) : (
                        <>
                            <Edit2 className="w-5 h-5" />
                            Editar Imagem
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
