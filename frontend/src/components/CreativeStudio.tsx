import React, { useState, useEffect } from 'react';
import { PenTool, Send, Copy, Check, Sparkles, Instagram, Linkedin, Mail, MessageCircle, Save, History, Trash2, Layout, FileText } from 'lucide-react';
import { ContentGenerator } from './ContentGenerator';

const CreativeStudio: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState('instagram');
    const [tone, setTone] = useState('persuasive');
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [savedCopies, setSavedCopies] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Carregar histórico ao iniciar
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/copies`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSavedCopies(data);
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    };

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        setGeneratedContent(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    type: platform === 'instagram' ? 'post' : platform === 'linkedin' ? 'article' : 'email',
                    platform: platform,
                    topic: topic,
                    tone: tone,
                    provider: 'openai',
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

    const handleSave = async () => {
        if (!generatedContent) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/copies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    topic,
                    platform,
                    tone,
                    content: generatedContent
                })
            });

            if (response.ok) {
                alert('Copy salva com sucesso!');
                fetchHistory(); // Atualiza a lista
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar copy.');
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir esta copy?')) return;

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/copies/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchHistory();
        } catch (error) {
            console.error('Erro ao deletar:', error);
        }
    };

    const loadCopy = (copy: any) => {
        setTopic(copy.topic);
        setPlatform(copy.platform);
        setTone(copy.tone || 'persuasive');
        setGeneratedContent(copy.content);
        setShowHistory(false); // Fecha histórico em mobile se necessário
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [activeTab, setActiveTab] = useState<'copy' | 'design'>('design');

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-screen">
            {/* Main Container */}
            <div className="w-full flex-1 flex flex-col">
                {/* Header Section with Tabs */}
                <div className="bg-white border-b border-slate-200 px-8 py-6">
                    <div className="max-w-6xl mx-auto w-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                    <Sparkles className="text-purple-600" /> Estúdio Criativo & Copywriter
                                </h1>
                                <p className="text-slate-600 mt-2">Central unificada para criação de textos persuasivos e design de posts.</p>
                            </div>

                            {activeTab === 'copy' && (
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showHistory ? 'bg-slate-200 text-slate-800' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                                >
                                    <History size={18} /> Histórico ({savedCopies.length})
                                </button>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('design')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'design'
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Layout size={18} />
                                Design & Mídia (IA Agent)
                            </button>
                            <button
                                onClick={() => setActiveTab('copy')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'copy'
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <FileText size={18} />
                                Sniper Copywriter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8">
                    <div className="max-w-6xl mx-auto w-full h-full">

                        {activeTab === 'design' ? (
                            <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <ContentGenerator
                                    isOpen={true}
                                    onClose={() => { }}
                                    mode="page"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                                {/* Coluna da Esquerda: Histórico (Condicional ou Fixo) */}
                                {showHistory && (
                                    <div className="lg:col-span-3 space-y-4 animate-fade-in">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[calc(100vh-200px)] overflow-y-auto">
                                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                <History size={16} /> Copys Salvas
                                            </h3>
                                            {savedCopies.length === 0 ? (
                                                <p className="text-sm text-slate-400 text-center py-8">Nenhuma copy salva ainda.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {savedCopies.map((copy) => (
                                                        <div
                                                            key={copy.id}
                                                            onClick={() => loadCopy(copy)}
                                                            className="p-3 rounded-lg border border-slate-100 hover:border-purple-200 hover:bg-purple-50 cursor-pointer transition-all group relative"
                                                        >
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${copy.platform === 'instagram' ? 'bg-pink-100 text-pink-700' :
                                                                    copy.platform === 'linkedin' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {copy.platform}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => handleDelete(copy.id, e)}
                                                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                            <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-1">{copy.topic}</p>
                                                            <p className="text-xs text-slate-400">{new Date(copy.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Coluna Central: Configuração */}
                                <div className={`${showHistory ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6 transition-all`}>
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
                                <div className={`${showHistory ? 'lg:col-span-6' : 'lg:col-span-8'} transition-all`}>
                                    <div className="bg-white h-full min-h-[600px] rounded-xl shadow-sm border border-slate-200 flex flex-col">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                                            <h3 className="font-bold text-slate-700">Resultado Gerado</h3>
                                            <div className="flex gap-2">
                                                {generatedContent && (
                                                    <button
                                                        onClick={handleSave}
                                                        className="text-sm text-slate-600 hover:text-primary-600 flex items-center gap-1 px-3 py-1 rounded-md hover:bg-white transition-colors border border-transparent hover:border-slate-200"
                                                    >
                                                        <Save size={16} /> Salvar
                                                    </button>
                                                )}
                                                {generatedContent && (
                                                    <button
                                                        onClick={() => copyToClipboard(generatedContent.body || JSON.stringify(generatedContent))}
                                                        className="text-sm text-slate-600 hover:text-purple-600 flex items-center gap-1 px-3 py-1 rounded-md hover:bg-white transition-colors border border-transparent hover:border-slate-200"
                                                    >
                                                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                                        {copied ? 'Copiado!' : 'Copiar'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-250px)]">
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
                                                                <p className="text-primary-600 text-sm">{generatedContent.hashtags.join(' ')}</p>
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreativeStudio;
