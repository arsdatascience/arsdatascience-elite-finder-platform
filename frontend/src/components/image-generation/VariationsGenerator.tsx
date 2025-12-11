import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { GeneratedImage } from '../../types';
import { Copy, RefreshCw } from 'lucide-react';

interface VariationsGeneratorProps {
    image: GeneratedImage;
    onGenerated?: (variations: GeneratedImage[]) => void;
    onError?: (error: string) => void;
}

export const VariationsGenerator: React.FC<VariationsGeneratorProps> = ({ image, onGenerated, onError }) => {
    const [loading, setLoading] = useState(false);
    const [variations, setVariations] = useState<GeneratedImage[]>([]);

    const handleGenerateVariations = async () => {
        setLoading(true);
        try {
            const result = await apiClient.imageGeneration.createVariations(image.id, 4);
            if (result.success) {
                setVariations(result.data);
                if (onGenerated) onGenerated(result.data);
            } else {
                if (onError) onError('Falha ao gerar variações');
            }
        } catch (err: any) {
            console.error(err);
            if (onError) onError(err.response?.data?.error || 'Erro ao gerar variações');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Variações
            </h3>

            <button
                onClick={handleGenerateVariations}
                disabled={loading}
                className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Gerando variações...
                    </>
                ) : (
                    <>
                        <Copy className="w-4 h-4" />
                        Gerar 4 Variações
                    </>
                )}
            </button>

            {variations.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                    {variations.map((variant, i) => (
                        <div key={variant.id} className="relative group">
                            <img
                                src={variant.thumbnailUrl || variant.url}
                                alt={`Variação ${i + 1}`}
                                className="w-full rounded-lg border border-gray-200"
                            />
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                Variação {i + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
