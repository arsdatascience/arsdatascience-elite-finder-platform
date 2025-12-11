import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { GeneratedImage, ImageModel } from '../types';
import { Sparkles, Download, RefreshCw, Trash2, Copy, Image as ImageIcon, Edit2, Maximize, Scissors, Clock, BarChart2, Languages } from 'lucide-react';
import { ImageEditor } from './image-generation/ImageEditor';
import { VariationsGenerator } from './image-generation/VariationsGenerator';
import { ImageUpscaler } from './image-generation/ImageUpscaler';
import { BackgroundRemover } from './image-generation/BackgroundRemover';
import { PromptTemplateSelector } from './image-generation/PromptTemplateSelector';
import PromptHistory from './image-generation/PromptHistory';
import { ImageLightbox } from './ui/ImageLightbox';
import { AnalyticsDashboard } from './image-generation/AnalyticsDashboard';
import { PromptTemplate } from '../lib/prompt-templates';

interface ImageGenerationPageProps {
    clientId?: number | null;
}

export const ImageGenerationPage: React.FC<ImageGenerationPageProps> = ({ clientId }) => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [model, setModel] = useState('flux-schnell');
    const [size, setSize] = useState({ width: 1024, height: 1024, label: 'Quadrado (1:1)' });
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const [gallery, setGallery] = useState<GeneratedImage[]>([]);
    const [models, setModels] = useState<ImageModel[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [steps, setSteps] = useState(25);
    const [guidance, setGuidance] = useState(7.5);
    const [seed, setSeed] = useState<number | ''>('');
    const [batchSize, setBatchSize] = useState(1);

    const [activeTool, setActiveTool] = useState<'none' | 'edit' | 'variations' | 'upscale' | 'remove-bg'>('none');
    const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    const SIZES = [
        { label: 'Quadrado (1:1)', width: 1024, height: 1024 },
        { label: 'Paisagem (16:9)', width: 1344, height: 768 },
        { label: 'Retrato (9:16)', width: 768, height: 1344 },
        { label: 'Foto (3:2)', width: 1216, height: 832 },
        { label: 'Personalizado', width: 1024, height: 1024 },
    ];

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        loadGallery();
    }, [clientId]);

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
            const data = await apiClient.imageGeneration.list(12, 1, clientId);
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
        setActiveTool('none');

        try {
            const result = await apiClient.imageGeneration.generate({
                prompt,
                negativePrompt,
                model,
                width: size.width,
                height: size.height,
                num_inference_steps: steps,
                guidance_scale: guidance,
                seed: seed === '' ? undefined : Number(seed),
                num_outputs: batchSize,
                clientId: clientId
            });

            if (result.success) {
                const newImages = Array.isArray(result.data) ? result.data : [result.data];
                setGeneratedImage(newImages[0]);
                loadGallery();
            } else {
                setError('Falha na geração da imagem.');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Erro ao conectar com servidor.';
            console.error('API Error:', errorMessage);

            // Map technical/DB errors to user-friendly messages
            if (errorMessage.includes('column') || errorMessage.includes('relation') || errorMessage.includes('SQL')) {
                setError('Erro interno no servidor. Por favor, tente novamente em alguns instantes. Se persistir, contate o suporte.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (url: string, prompt: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Erro no download:', err);
            window.open(url, '_blank');
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

    const handleToolSuccess = (newImage: GeneratedImage | GeneratedImage[]) => {
        loadGallery();
        if (!Array.isArray(newImage)) {
            setGeneratedImage(newImage);
        } else {
            setGeneratedImage(newImage[0]);
        }
        setActiveTool('none');
    };

    const handleTemplateSelect = (template: PromptTemplate) => {
        setPrompt(template.prompt.replace('[SUBJECT]', prompt || 'subject'));
        if (template.negativePrompt) setNegativePrompt(template.negativePrompt);
    };

    const handleTranslate = async (targetLang: 'pt' | 'en') => {
        if (!prompt) return;
        try {
            setLoading(true);
            const res = await apiClient.imageGeneration.translate(prompt, targetLang);
            if (res.translatedText) {
                setPrompt(res.translatedText);
            }
        } catch (error) {
            console.error('Erro ao traduzir:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Geração de Imagens IA</h1>
                        <p className="text-gray-500">Crie visuais incríveis para suas campanhas em segundos.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAnalytics(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                >
                    <BarChart2 size={18} />
                    Analytics
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <form onSubmit={handleGenerate} className="space-y-5">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Prompt (Descrição)</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowHistory(true)}
                                            className="text-xs flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium"
                                        >
                                            <Clock size={14} /> Histórico
                                        </button>
                                        <PromptTemplateSelector onSelect={handleTemplateSelect} />
                                    </div>
                                </div>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Descreva a imagem detalhadamente..."
                                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none resize-none text-sm"
                                    maxLength={1000}
                                    required
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleTranslate('en')}
                                            className="text-xs text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                                            disabled={loading}
                                            title="Traduzir para Inglês (Melhor para IAs)"
                                        >
                                            <Languages size={12} /> Traduzir para Inglês
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTranslate('pt')}
                                            className="text-xs text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                                            disabled={loading}
                                            title="Traduzir para Português"
                                        >
                                            <Languages size={12} /> Traduzir para Português
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-400">{prompt.length}/1000</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Modelo IA</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {models.length > 0 ? models.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setModel(m.id)}
                                            className={`p-3 border rounded-lg text-left transition-all ${model === m.id ? 'border-slate-500 bg-slate-50 ring-1 ring-slate-500' : 'border-gray-200 hover:bg-gray-50'}`}
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
                                    value={SIZES.findIndex(s => s.label === size.label) !== -1 ? SIZES.findIndex(s => s.label === size.label) : 4}
                                    onChange={(e) => setSize(SIZES[parseInt(e.target.value)])}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                                >
                                    {SIZES.map((s, i) => (
                                        <option key={i} value={i}>{s.label}</option>
                                    ))}
                                </select>

                                {size.label === 'Personalizado' && (
                                    <div className="grid grid-cols-2 gap-4 mt-3 animate-in fade-in slide-in-from-top-1">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Largura (px)</label>
                                            <input
                                                type="number"
                                                value={size.width}
                                                onChange={(e) => setSize({ ...size, width: Number(e.target.value) })}
                                                step="64" min="256" max="2048"
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Altura (px)</label>
                                            <input
                                                type="number"
                                                value={size.height}
                                                onChange={(e) => setSize({ ...size, height: Number(e.target.value) })}
                                                step="64" min="256" max="2048"
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <details className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <summary className="cursor-pointer font-medium hover:text-slate-600 flex items-center justify-between">
                                    <span>Opções Avançadas</span>
                                    <span className="text-xs text-gray-400">(Steps, Guidance, Seed, Batch)</span>
                                </summary>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Prompt Negativo</label>
                                        <textarea
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            placeholder="Ex: blurry, low quality, distorted..."
                                            className="w-full h-16 p-2 border border-gray-300 rounded text-xs resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1" title="Mais passos = maior qualidade (e tempo)">Passos: {steps}</label>
                                            <input
                                                type="range" min="1" max="50" value={steps}
                                                onChange={(e) => setSteps(Number(e.target.value))}
                                                className="w-full accent-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1" title="Quão fiel ao prompt (7-10 é ideal)">Fidelidade (Guidance): {guidance}</label>
                                            <input
                                                type="range" min="1" max="20" step="0.5" value={guidance}
                                                onChange={(e) => setGuidance(Number(e.target.value))}
                                                className="w-full accent-slate-600"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Quantidade: {batchSize}</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range" min="1" max="4" value={batchSize}
                                                onChange={(e) => setBatchSize(Number(e.target.value))}
                                                className="flex-1 accent-slate-600"
                                            />
                                            <span className="text-sm font-bold text-slate-800 w-6 text-center">{batchSize}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">Gera múltiplas imagens de uma vez (Max 4).</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Seed (Semente Aleatória)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Aleatório"
                                                value={seed}
                                                onChange={(e) => setSeed(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="flex-1 p-2 border border-gray-300 rounded text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
                                                className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300"
                                            >
                                                🎲
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </details>

                            <button
                                type="submit"
                                disabled={loading || !prompt.trim()}
                                className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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
                                <div
                                    className="relative group rounded-lg overflow-hidden shadow-lg border border-gray-100 bg-gray-50 cursor-zoom-in"
                                    onClick={() => setLightboxImage(generatedImage)}
                                >
                                    <img
                                        src={generatedImage.url}
                                        alt={generatedImage.prompt}
                                        className="w-full h-auto max-h-[600px] object-contain mx-auto"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
                                        {/* Overlay actions if needed */}
                                    </div>
                                </div>

                                {/* Advanced Tools Toolbar */}
                                <div className="flex flex-wrap gap-2 justify-center border-b border-gray-100 pb-4">
                                    <button
                                        onClick={() => handleDownload(generatedImage.url, generatedImage.prompt)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>

                                    <div className="w-px h-8 bg-gray-300 mx-2 self-center hidden md:block"></div>

                                    <button
                                        onClick={() => setActiveTool(activeTool === 'edit' ? 'none' : 'edit')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${activeTool === 'edit' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => setActiveTool(activeTool === 'variations' ? 'none' : 'variations')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${activeTool === 'variations' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        <Copy className="w-4 h-4" />
                                        Variações
                                    </button>

                                    <button
                                        onClick={() => setActiveTool(activeTool === 'upscale' ? 'none' : 'upscale')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${activeTool === 'upscale' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        <Maximize className="w-4 h-4" />
                                        Upscale
                                    </button>

                                    <button
                                        onClick={() => setActiveTool(activeTool === 'remove-bg' ? 'none' : 'remove-bg')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${activeTool === 'remove-bg' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        <Scissors className="w-4 h-4" />
                                        Remover Fundo
                                    </button>
                                </div>

                                {/* Active Tool Area */}
                                {activeTool !== 'none' && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {activeTool === 'edit' && (
                                            <ImageEditor
                                                originalImage={generatedImage}
                                                onEdited={handleToolSuccess}
                                                onError={setError}
                                            />
                                        )}
                                        {activeTool === 'variations' && (
                                            <VariationsGenerator
                                                image={generatedImage}
                                                onGenerated={handleToolSuccess}
                                                onError={setError}
                                            />
                                        )}
                                        {activeTool === 'upscale' && (
                                            <ImageUpscaler
                                                image={generatedImage}
                                                onUpscaled={handleToolSuccess}
                                                onError={setError}
                                            />
                                        )}
                                        {activeTool === 'remove-bg' && (
                                            <BackgroundRemover
                                                image={generatedImage}
                                                onRemoved={handleToolSuccess}
                                                onError={setError}
                                            />
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
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
                                        onClick={() => {
                                            setGeneratedImage(img);
                                            setActiveTool('none');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all relative group aspect-square ${generatedImage?.id === img.id ? 'border-slate-500 ring-2 ring-slate-200' : 'border-transparent hover:border-gray-300'}`}
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

            <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />

            {
                showHistory && (
                    <PromptHistory
                        onSelect={(p) => {
                            setPrompt(p);
                            setShowHistory(false);
                        }}
                        onClose={() => setShowHistory(false)}
                    />
                )
            }

            {showAnalytics && <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />}
        </div >
    );
};
