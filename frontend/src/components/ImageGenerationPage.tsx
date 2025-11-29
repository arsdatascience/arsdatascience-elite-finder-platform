import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { GeneratedImage, ImageModel } from '../image-generation-types';
import { Sparkles, Download, RefreshCw, Trash2, Copy, Image as ImageIcon } from 'lucide-react';

export const ImageGenerationPage: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [model, setModel] = useState('flux-schnell');
    const [size, setSize] = useState({ width: 1024, height: 1024, label: 'Quadrado (1:1)' });
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const [gallery, setGallery] = useState<GeneratedImage[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const SIZES = [
        { label: 'Quadrado (1:1)', width: 1024, height: 1024 },
        { label: 'Paisagem (16:9)', width: 1344, height: 768 },
        { label: 'Retrato (9:16)', width: 768, height: 1344 },
        { label: 'Foto (3:2)', width: 1216, height: 832 },
    ];

    useEffect(() => {
        loadModels();
        loadGallery();
    }, []);

    const loadModels = async () => {
        try {
            const data = await apiClient.imageGeneration.getModels();
            if (data && data.models) setModels(data.models);
        } catch (err) {
            console.error('Erro ao carregar modelos:', err);
        }
    };

    const loadGallery = async () => {
        try {
            const data = await apiClient.imageGeneration.list(12, 1);
            if (data && data.data) setGallery(data.data);
        } catch (err) {
            console.error('Erro ao carregar galeria:', err);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const result = await apiClient.imageGeneration.generate({
                prompt,
                negativePrompt,
                model,
                width: size.width,
                height: size.height
            });

            if (result.success) {
                setGeneratedImage(result.data);
                loadGallery(); // Atualiza galeria
            } else {
                setError('Falha na geração da imagem.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao conectar com servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja deletar esta imagem?')) return;
        try {
            await apiClient.imageGeneration.delete(id);
            setGallery(prev => prev.filter(img => img.id !== id));
            if (generatedImage?.id === id) setGeneratedImage(null);
        } catch (err) {
            alert('Erro ao deletar imagem.');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Prompt copiado!');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Geração de Imagens IA</h1>
                    <p className="text-gray-500">Crie visuais incríveis para suas campanhas em segundos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <form onSubmit={handleGenerate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Prompt (Descrição)</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Descreva a imagem detalhadamente..."
                                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
                                    maxLength={1000}
                                    required
                                />
                                <div className="text-right text-xs text-gray-400 mt-1">{prompt.length}/1000</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Modelo IA</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {models.length > 0 ? models.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setModel(m.id)}
                                            className={`p-3 border rounded-lg text-left transition-all ${model === m.id ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <div className="font-medium text-sm text-gray-900">{m.name}</div>
                                            <div className="text-xs text-gray-500">{m.description}</div>
                                        </button>
                                    )) : <p className="text-sm text-gray-500">Carregando modelos...</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
                                <select
                                    value={SIZES.findIndex(s => s.label === size.label)}
                                    onChange={(e) => setSize(SIZES[parseInt(e.target.value)])}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    {SIZES.map((s, i) => (
                                        <option key={i} value={i}>{s.label}</option>
                                    ))}
                                </select>
                            </div>

                            <details className="text-sm text-gray-600">
                                <summary className="cursor-pointer font-medium hover:text-purple-600">Opções Avançadas</summary>
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Prompt Negativo (O que evitar)</label>
                                    <textarea
                                        value={negativePrompt}
                                        onChange={(e) => setNegativePrompt(e.target.value)}
                                        placeholder="Ex: blurry, low quality, distorted..."
                                        className="w-full h-20 p-2 border border-gray-300 rounded-lg text-sm resize-none"
                                    />
                                </div>
                            </details>

                            <button
                                type="submit"
                                disabled={loading || !prompt.trim()}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                {loading ? 'Gerando...' : 'Gerar Imagem'}
                            </button>
                            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
                        </form>
                    </div>
                </div>

                {/* Preview & Gallery Section */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Main Preview */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[400px] flex flex-col items-center justify-center relative">
                        {generatedImage ? (
                            <div className="w-full space-y-4">
                                <div className="relative group rounded-lg overflow-hidden shadow-lg border border-gray-100">
                                    <img src={generatedImage.url} alt={generatedImage.prompt} className="w-full h-auto max-h-[600px] object-contain bg-gray-50" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <a href={generatedImage.url} download target="_blank" rel="noreferrer" className="p-3 bg-white rounded-full text-gray-800 hover:bg-gray-100 transition-colors" title="Download">
                                            <Download size={24} />
                                        </a>
                                    </div>
                                </div>
                                <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 line-clamp-2" title={generatedImage.prompt}>{generatedImage.prompt}</p>
                                        <p className="text-xs text-gray-500 mt-1">{generatedImage.width}x{generatedImage.height} • {generatedImage.model}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => copyToClipboard(generatedImage.prompt)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Copiar Prompt"><Copy size={16} /></button>
                                        <button onClick={() => handleDelete(generatedImage.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Deletar"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ImageIcon size={40} className="opacity-50" />
                                </div>
                                <p className="text-lg font-medium">Sua obra de arte aparecerá aqui</p>
                                <p className="text-sm">Preencha o formulário ao lado para começar.</p>
                            </div>
                        )}
                    </div>

                    {/* Gallery Grid */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ImageIcon size={20} /> Galeria Recente
                        </h3>
                        {gallery.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {gallery.map(img => (
                                    <div
                                        key={img.id}
                                        onClick={() => setGeneratedImage(img)}
                                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all relative group aspect-square ${generatedImage?.id === img.id ? 'border-purple-500 ring-2 ring-purple-200' : 'border-transparent hover:border-gray-300'}`}
                                    >
                                        <img src={img.thumbnailUrl || img.url} alt={img.prompt} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                            <p className="text-white text-[10px] line-clamp-2">{img.prompt}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">Nenhuma imagem gerada ainda.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
