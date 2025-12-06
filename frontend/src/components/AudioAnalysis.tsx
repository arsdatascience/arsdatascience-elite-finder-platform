import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileAudio, Mic, Loader2, AlertCircle, BarChart2, History, Trash2, Eye, Download, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface AnalysisResult {
    id?: number;
    created_at?: string;
    summary: string;
    globalSentiment: {
        label: 'Positivo' | 'Negativo' | 'Neutro';
        score: number;
    };
    speakers: string[];
    segments: {
        id: number;
        speaker: string;
        text: string;
        timestampStart: number;
        timestampEnd: number;
        sentiment: 'Positivo' | 'Negativo' | 'Neutro';
        sentimentScore: number;
    }[];
}

interface HistoryItem {
    id: number;
    filename: string;
    created_at: string;
    global_sentiment: {
        label: 'Positivo' | 'Negativo' | 'Neutro';
        score: number;
    };
}

export const AudioAnalysis: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audio/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('audio', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audio/analyze`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Erro no upload');
            }

            const data = await response.json();
            if (data.success) {
                setResult(data.data);
            } else {
                throw new Error('Falha na análise');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao processar áudio');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta análise?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/audio/analysis/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchHistory();
        } catch (err) {
            console.error(err);
        }
    };

    const handleView = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audio/analysis/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Mapear campos do banco (snake_case) para o formato do frontend (camelCase) se necessário
                // O controller retorna o objeto salvo, que pode ter chaves mistas se não cuidarmos.
                // Mas no insert usamos JSON.stringify, então ao ler o pg retorna objeto.
                // Vamos garantir a estrutura:
                const formattedResult: AnalysisResult = {
                    id: data.id,
                    created_at: data.created_at,
                    summary: data.summary,
                    globalSentiment: data.global_sentiment || data.globalSentiment,
                    speakers: data.speakers,
                    segments: data.segments
                };
                setResult(formattedResult);
                setActiveTab('new');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const exportToDocx = async () => {
        if (!result) return;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "Relatório de Análise de Áudio - Elite Finder",
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        text: `Data: ${new Date().toLocaleDateString()}`,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: "Resumo Executivo",
                        heading: HeadingLevel.HEADING_1,
                        spacing: { after: 200, before: 200 }
                    }),
                    new Paragraph({
                        text: result.summary,
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        text: `Sentimento Global: ${result.globalSentiment.label} (${(result.globalSentiment.score * 100).toFixed(0)}%)`,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        text: "Transcrição Detalhada",
                        heading: HeadingLevel.HEADING_1,
                        spacing: { after: 200 }
                    }),
                    ...result.segments.flatMap(s => [
                        new Paragraph({
                            children: [
                                new TextRun({ text: `[${formatTime(s.timestampStart)} - ${formatTime(s.timestampEnd)}] `, bold: true, size: 20 }),
                                new TextRun({ text: `${s.speaker}: `, bold: true, color: "2E75B6", size: 24 }),
                            ],
                            spacing: { before: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: s.text, size: 24 })
                            ],
                            spacing: { after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: `Sentimento: ${s.sentiment}`, italics: true, color: "666666", size: 20 })
                            ],
                            spacing: { after: 300 }
                        })
                    ])
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `analise_audio_${result.id || Date.now()}.docx`);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getSentimentData = () => {
        if (!result) return [];
        const counts = { Positivo: 0, Neutro: 0, Negativo: 0 };
        result.segments.forEach(s => {
            if (counts[s.sentiment] !== undefined) counts[s.sentiment]++;
        });
        return [
            { name: 'Positivo', value: counts.Positivo, color: '#22c55e' },
            { name: 'Neutro', value: counts.Neutro, color: '#94a3b8' },
            { name: 'Negativo', value: counts.Negativo, color: '#ef4444' }
        ].filter(d => d.value > 0);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Mic className="text-primary-600" /> Análise de Áudio Inteligente
                    </h1>
                    <p className="text-slate-500 mt-2">Transcreva áudios e analise sentimentos com IA (Whisper + GPT-4o)</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => {
                            setActiveTab('new');
                            setFile(null);
                            setResult(null);
                            setError(null);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'new' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Plus size={16} /> Nova Análise
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} /> Histórico
                    </button>
                </div>
            </div>

            {activeTab === 'new' ? (
                <>
                    {/* Upload Area */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".mp3,.wav,.ogg,.m4a,.flac,.mpeg,.mpga,.opus,.webm,.mp4"
                            className="hidden"
                        />

                        {!file && !result && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className="cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-10 hover:bg-slate-50 transition-colors group"
                            >
                                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="text-primary-600" size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700">Arraste e solte ou clique para selecionar</h3>
                                <p className="text-slate-400 text-sm mt-1">MP3, WAV, OGG, M4A, FLAC (Máx. 20MB)</p>
                            </div>
                        )}

                        {file && !result && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center gap-3 text-slate-700 bg-slate-50 p-4 rounded-lg inline-block">
                                    <FileAudio className="text-primary-600" />
                                    <span className="font-medium">{file.name}</span>
                                    <span className="text-xs text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 ml-2"><AlertCircle size={16} /></button>
                                </div>

                                <div>
                                    <button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-lg shadow-primary-200"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="animate-spin" /> Processando...
                                            </>
                                        ) : (
                                            <>
                                                <Mic size={20} /> Iniciar Análise
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center justify-center gap-2">
                                <AlertCircle size={20} /> {error}
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button
                                    onClick={exportToDocx}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    <Download size={18} /> Exportar DOCX
                                </button>
                            </div>

                            {/* Summary & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <BarChart2 className="text-purple-600" /> Resumo Executivo
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">{result.summary}</p>

                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="px-4 py-2 bg-slate-100 rounded-lg">
                                            <span className="text-xs text-slate-500 uppercase font-bold">Sentimento Global</span>
                                            <div className={`text-lg font-bold ${result.globalSentiment.label === 'Positivo' ? 'text-green-600' :
                                                result.globalSentiment.label === 'Negativo' ? 'text-red-600' : 'text-slate-600'
                                                }`}>
                                                {result.globalSentiment.label} ({(result.globalSentiment.score * 100).toFixed(0)}%)
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-slate-100 rounded-lg">
                                            <span className="text-xs text-slate-500 uppercase font-bold">Falantes</span>
                                            <div className="text-lg font-bold text-slate-800">
                                                {result.speakers.length}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Distribuição</h3>
                                    <div className="w-full h-64 min-w-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={getSentimentData()}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {getSentimentData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Transcription */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-200 bg-slate-50">
                                    <h3 className="text-lg font-bold text-slate-800">Transcrição Detalhada</h3>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                                    {result.segments.map((segment) => (
                                        <div key={segment.id} className="p-6 hover:bg-slate-50 transition-colors flex gap-4">
                                            <div className="min-w-[100px] text-right">
                                                <div className="text-xs font-mono text-slate-400 mb-1">
                                                    {formatTime(segment.timestampStart)} - {formatTime(segment.timestampEnd)}
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${segment.speaker.includes('A') || segment.speaker.includes('1') ? 'bg-primary-100 text-primary-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {segment.speaker}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-800 mb-2">{segment.text}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${segment.sentiment === 'Positivo' ? 'border-green-200 text-green-700 bg-green-50' :
                                                        segment.sentiment === 'Negativo' ? 'border-red-200 text-red-700 bg-red-50' :
                                                            'border-slate-200 text-slate-600 bg-slate-50'
                                                        }`}>
                                                        {segment.sentiment} ({(segment.sentimentScore * 100).toFixed(0)}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-center">
                                <button
                                    onClick={() => { setFile(null); setResult(null); setError(null); }}
                                    className="text-primary-600 hover:text-primary-800 font-medium"
                                >
                                    Analisar outro arquivo
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800">Histórico de Análises</h3>
                    </div>

                    {isLoadingHistory ? (
                        <div className="p-10 text-center text-slate-500">
                            <Loader2 className="animate-spin mx-auto mb-2" /> Carregando histórico...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            Nenhuma análise encontrada.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Data</th>
                                        <th className="p-4">Arquivo</th>
                                        <th className="p-4">Sentimento</th>
                                        <th className="p-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-slate-600">
                                                {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                                            </td>
                                            <td className="p-4 font-medium text-slate-800">{item.filename}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.global_sentiment?.label === 'Positivo' ? 'bg-green-100 text-green-700' :
                                                    item.global_sentiment?.label === 'Negativo' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {item.global_sentiment?.label || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleView(item.id)}
                                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
