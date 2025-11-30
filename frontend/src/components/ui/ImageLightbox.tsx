import React from 'react';
import { X, Download, Copy, ExternalLink } from 'lucide-react';
import { GeneratedImage } from '../../types';

interface ImageLightboxProps {
    image: GeneratedImage | null;
    onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ image, onClose }) => {
    if (!image) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(image.url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${image.prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(image.url, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center animate-in fade-in duration-200">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
                <X size={32} />
            </button>

            <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center">
                <img
                    src={image.url}
                    alt={image.prompt}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                />

                <div className="mt-6 flex flex-col items-center gap-4 w-full max-w-2xl">
                    <p className="text-white/90 text-center text-sm md:text-base font-medium line-clamp-2">
                        {image.prompt}
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors font-medium text-sm"
                        >
                            <Download size={16} />
                            Download
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(image.prompt);
                                alert('Prompt copiado!');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors font-medium text-sm backdrop-blur-sm"
                        >
                            <Copy size={16} />
                            Copiar Prompt
                        </button>
                        <a
                            href={image.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors font-medium text-sm backdrop-blur-sm"
                        >
                            <ExternalLink size={16} />
                            Abrir Original
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
