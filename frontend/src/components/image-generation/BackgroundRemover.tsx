import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { GeneratedImage } from '../../types';
import { Scissors, RefreshCw, Download } from 'lucide-react';

interface BackgroundRemoverProps {
    image: GeneratedImage;
    onRemoved?: (newImage: GeneratedImage) => void;
    onError?: (error: string) => void;
}

export const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({ image, onRemoved, onError }) => {
    const [loading, setLoading] = useState(false);
    const [processedImage, setProcessedImage] = useState<GeneratedImage | null>(null);

    const handleRemoveBg = async () => {
        setLoading(true);
        try {
            const result = await apiClient.imageGeneration.removeBackground(image.url);
            if (result.success) {
                setProcessedImage(result.data);
                if (onRemoved) onRemoved(result.data);
            } else {
                if (onError) onError('Falha ao remover fundo');
            }
        } catch (err: any) {
            console.error(err);
            if (onError) onError(err.response?.data?.error || 'Erro ao remover fundo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Remover Fundo
            </h3>

            <button
                onClick={handleRemoveBg}
                disabled={loading}
                className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Removendo...
                    </>
                ) : (
                    <>
                        <Scissors className="w-5 h-5" />
                        Remover Fundo
                    </>
                )}
            </button>

            {processedImage && (
                <div className="border border-gray-200 rounded-lg p-4 mt-4 bg-checkerboard">
                    <h4 className="font-medium mb-2 text-sm text-gray-700">
                        Resultado (Sem Fundo)
                    </h4>
                    <div className="bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAFxlEQVQ4T2NggID/DAz/o4E4Dwc0MxkAANpeQv70UaO+AAAAAElFTkSuQmCC')]">
                        <img
                            src={processedImage.url}
                            alt="No BG"
                            className="w-full rounded-lg object-contain"
                        />
                    </div>

                    <a
                        href={processedImage.url}
                        download={`nobg-${Date.now()}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download PNG
                    </a>
                </div>
            )}
        </div>
    );
};
