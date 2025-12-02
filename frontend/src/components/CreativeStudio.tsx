import React, { useState } from 'react';
import { PenTool, Send, Copy, Check, Sparkles, Instagram, Linkedin, Mail, MessageCircle } from 'lucide-react';

const CreativeStudio: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState('instagram');
    const [tone, setTone] = useState('persuasive');
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        setGeneratedContent(null);

        try {
            // Chamada direta ao Backend (aiController)
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Autenticação do usuário
                },
                body: JSON.stringify({
                    type: platform === 'instagram' ? 'post' : platform === 'linkedin' ? 'article' : 'email',
                    platform: platform,
                    topic: topic,
                    tone: tone,
                    provider: 'openai', // ou 'anthropic' se preferir
                    model: 'gpt-4-turbo-preview'
                })
            });

            const data = await response.json();
            setGeneratedContent(data);
        } catch (error) {
            console.error('Erro ao gerar copy:', error);
            alert('Erro ao gerar conteúdo. Verifique se a API Key está configurada.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-screen p-8">
            <div className="max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Sparkles className="text-purple-600" /> Estúdio Criativo (Sniper Copywriter)
                    </h1>
                    <p className="text-slate-600 mt-2">Gere conteúdos de alta conversão em segundos usando IA.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna da Esquerda: Controles */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <PenTool size={18} /> Configuração
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tópico / Tema</label>
                                    <textarea
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="Ex: Promoção de Black Friday para curso de inglês..."
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-32 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Plataforma</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPlatform('instagram')}
                                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${platform === 'instagram' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'hover:bg-slate-50'}`}
                                        >
                                            <Instagram size={20} /> <span className="text-xs font-medium">Instagram</span>
                                        </button>
                                        <button
                                            onClick={() => setPlatform('linkedin')}
                                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${platform === 'linkedin' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50'}`}
                                        >
                                            <Linkedin size={20} /> <span className="text-xs font-medium">LinkedIn</span>
                                        </button>
                                        <button
                                            onClick={() => setPlatform('email')}
                                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${platform === 'email' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'hover:bg-slate-50'}`}
                                        >
                                            <Mail size={20} /> <span className="text-xs font-medium">Email Mkt</span>
                                        </button>
                                        <button
                                            onClick={() => setPlatform('whatsapp')}
                                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${platform === 'whatsapp' ? 'bg-green-50 border-green-500 text-green-700' : 'hover:bg-slate-50'}`}
                                        >
                                            <MessageCircle size={20} /> <span className="text-xs font-medium">WhatsApp</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tom de Voz</label>
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                                    >
                                        <option value="persuasive">Persuasivo (Vendas)</option>
                                        <option value="educational">Educativo / Autoridade</option>
                                        <option value="funny">Descontraído / Humor</option>
                                        <option value="urgent">Urgência / Escassez</option>
                                        <option value="professional">Corporativo / Sério</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !topic}
                                    className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all ${loading || !topic ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-200'}`}
                                >
                                    {loading ? (
                                        <>Generating...</>
                                    ) : (
                                        <><Send size={18} /> Gerar Copy</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Coluna da Direita: Resultado */}
                    <div className="lg:col-span-2">
                        <div className="bg-white h-full min-h-[500px] rounded-xl shadow-sm border border-slate-200 flex flex-col">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                                <h3 className="font-bold text-slate-700">Resultado Gerado</h3>
                                {generatedContent && (
                                    <button
                                        onClick={() => copyToClipboard(generatedContent.body || JSON.stringify(generatedContent))}
                                        className="text-sm text-slate-600 hover:text-purple-600 flex items-center gap-1 px-3 py-1 rounded-md hover:bg-white transition-colors"
                                    >
                                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        {copied ? 'Copiado!' : 'Copiar Texto'}
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto">
                                {!generatedContent && !loading && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Sparkles size={48} className="mb-4 opacity-20" />
                                        <p>Seu conteúdo gerado por IA aparecerá aqui.</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="h-full flex flex-col items-center justify-center text-purple-600">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                                        <p className="animate-pulse">Criando magia...</p>
                                    </div>
                                )}

                                {generatedContent && (
                                    <div className="space-y-6 animate-fade-in">
                                        {/* Headlines */}
                                        {generatedContent.headlines && (
                                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                                <h4 className="text-xs font-bold text-purple-700 uppercase mb-2">Opções de Título</h4>
                                                <ul className="space-y-2">
                                                    {generatedContent.headlines.map((h: string, i: number) => (
                                                        <li key={i} className="flex gap-2 text-purple-900 font-medium">
                                                            <span className="text-purple-400">{i + 1}.</span> {h}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Body */}
                                        <div className="prose prose-slate max-w-none">
                                            <div className="whitespace-pre-wrap text-slate-800 text-lg leading-relaxed">
                                                {generatedContent.body}
                                            </div>
                                        </div>

                                        {/* Extras */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                            {generatedContent.hashtags && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Hashtags</h4>
                                                    <p className="text-blue-600 text-sm">{generatedContent.hashtags.join(' ')}</p>
                                                </div>
                                            )}
                                            {generatedContent.imageIdea && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Ideia Visual</h4>
                                                    <p className="text-slate-600 text-sm italic">"{generatedContent.imageIdea}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreativeStudio;
