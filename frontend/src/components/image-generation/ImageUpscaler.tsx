import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { GeneratedImage } from '../../types';
import { Maximize, RefreshCw, Download } from 'lucide-react';

interface ImageUpscalerProps {
    image: GeneratedImage;
    onUpscaled?: (upscaledImage: GeneratedImage) => void;
    onError?: (error: string) => void;
}

export const ImageUpscaler: React.FC<ImageUpscalerProps> = ({ image, onUpscaled, onError }) => {
    const [loading, setLoading] = useState(false);
    const [scale, setScale] = useState<2 | 4>(2);
    const [upscaledImage, setUpscaledImage] = useState<GeneratedImage | null>(null);

    const handleUpscale = async () => {
        setLoading(true);
        try {
            const result = await apiClient.imageGeneration.upscale({
                imageUrl: image.url,
                scale
            });
            if (result.success) {
                setUpscaledImage(result.data);
                if (onUpscaled) onUpscaled(result.data);
            } else {
                if (onError) onError('Falha ao fazer upscale');
            }
        } catch (err: any) {
            console.error(err);
            if (onError) onError(err.response?.data?.error || 'Erro ao fazer upscale');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Maximize className="w-5 h-5" />
                Upscale (Melhorar Resolução)
            </h3>

            <div className="flex gap-2">
                <button
                    onClick={() => setScale(2)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${scale === 2
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    2x ({image.width * 2}x{image.height * 2})
                </button>
                <button
                    onClick={() => setScale(4)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${scale === 4
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    4x ({image.width * 4}x{image.height * 4})
                </button>
            </div>

            <button
                onClick={handleUpscale}
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Processando...
                    </>
                ) : (
                    <>
                        <Maximize className="w-5 h-5" />
                        Upscale {scale}x
                    </>
                )}
            </button>

            {upscaledImage && (
                <div className="border border-gray-200 rounded-lg p-4 mt-4">
                    <h4 className="font-medium mb-2 text-sm text-gray-700">
                        Resultado ({upscaledImage.width || 'High Res'}x{upscaledImage.height || 'High Res'})
                    </h4>
                    <img
                        src={upscaledImage.url}
                        alt="Upscaled"
                        className="w-full rounded-lg border border-gray-200"
                    />

                    <a
                        href={upscaledImage.url}
                        download={`upscaled-${Date.now()}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </a>
                </div>
            )}
        </div>
    );
};
