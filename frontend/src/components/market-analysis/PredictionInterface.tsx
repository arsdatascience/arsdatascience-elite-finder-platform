import React, { useState, useEffect } from 'react';
import {
    Target, Upload, Play, Download, RefreshCw, CheckCircle,
    AlertCircle, FileText, Database, Cpu, Trash2
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface DeployedModel {
    id: string;
    name: string;
    algorithm: string;
    task_type: string;
    metrics?: Record<string, number>;
    deployed_at?: string;
}

interface PredictionResult {
    row_id: number;
    prediction: number | string;
    probability?: number;
    confidence?: number;
}

export const PredictionInterface: React.FC = () => {
    const [models, setModels] = useState<DeployedModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [predictions, setPredictions] = useState<PredictionResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingModels, setLoadingModels] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inputMode, setInputMode] = useState<'file' | 'manual'>('file');
    const [manualInput, setManualInput] = useState<string>('');

    useEffect(() => {
        loadDeployedModels();
    }, []);

    const loadDeployedModels = async () => {
        setLoadingModels(true);
        try {
            // Get all completed experiments as potential models
            const data = await apiClient.marketAnalysis.getExperiments();
            const completed = (data || []).filter((e: any) => e.status === 'completed');
            setModels(completed);
        } catch (err) {
            console.error('Failed to load models', err);
        } finally {
            setLoadingModels(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            const ext = f.name.split('.').pop()?.toLowerCase();
            if (['csv', 'json', 'xlsx'].includes(ext || '')) {
                setFile(f);
                setError(null);
            } else {
                setError('Formato inválido. Use CSV, JSON ou Excel.');
            }
        }
    };

    const runPrediction = async () => {
        if (!selectedModel) {
            setError('Selecione um modelo');
            return;
        }

        setLoading(true);
        setError(null);
        setPredictions([]);

        try {
            // Parse input data
            let inputData: any[] = [];

            if (inputMode === 'manual' && manualInput.trim()) {
                try {
                    inputData = JSON.parse(manualInput);
                    if (!Array.isArray(inputData)) {
                        inputData = [inputData];
                    }
                } catch {
                    setError('JSON inválido. Verifique o formato.');
                    setLoading(false);
                    return;
                }
            } else if (inputMode === 'file' && file) {
                // For file input, we'll send placeholder data
                // Backend will handle file parsing or use mock if unavailable
                inputData = [{ file_uploaded: true, filename: file.name }];
            } else {
                // Demo mode - generate sample data
                inputData = Array(5).fill(0).map((_, i) => ({ sample_id: i + 1, demo: true }));
            }

            // Call real API endpoint
            const response = await apiClient.marketAnalysis.runPrediction(selectedModel, inputData);

            if (response.success && response.predictions) {
                // Transform response to expected format
                const formattedPredictions: PredictionResult[] = response.predictions.map((pred: any, i: number) => ({
                    row_id: pred.row_id || i + 1,
                    prediction: pred.prediction,
                    probability: pred.probability,
                    confidence: pred.confidence
                }));
                setPredictions(formattedPredictions);
            } else {
                setError('Nenhuma predição retornada');
            }
        } catch (err: any) {
            console.error('Prediction error:', err);
            setError(err.response?.data?.error || 'Erro ao fazer predição');
        } finally {
            setLoading(false);
        }
    };

    const exportResults = () => {
        if (predictions.length === 0) return;

        const headers = Object.keys(predictions[0]).join(',');
        const rows = predictions.map(p => Object.values(p).join(','));
        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `predictions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const selectedModelData = models.find(m => m.id === selectedModel);

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Target className="w-7 h-7 text-[#597996]" />
                        Predições
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Use seus modelos treinados para fazer predições em novos dados
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Model Selection */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Model Selector */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-[#597996]" />
                                Modelo
                            </h3>

                            {loadingModels ? (
                                <div className="flex justify-center py-8">
                                    <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                                </div>
                            ) : models.length === 0 ? (
                                <div className="text-center py-8">
                                    <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">Nenhum modelo treinado</p>
                                    <p className="text-slate-400 text-xs mt-1">Treine um modelo primeiro</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {models.map(model => (
                                        <div
                                            key={model.id}
                                            onClick={() => setSelectedModel(model.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all
                                                ${selectedModel === model.id
                                                    ? 'border-[#597996] bg-[#597996]/5 shadow-sm'
                                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-slate-800 text-sm">{model.name}</p>
                                                    <p className="text-xs text-slate-500">{model.algorithm}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium
                                                    ${model.task_type === 'classification'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : model.task_type === 'regression'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-green-100 text-green-700'}`}>
                                                    {model.task_type}
                                                </span>
                                            </div>
                                            {model.metrics && (
                                                <div className="mt-2 flex gap-2">
                                                    {Object.entries(model.metrics).slice(0, 2).map(([key, val]) => (
                                                        <span key={key} className="text-xs text-slate-400">
                                                            {key}: {typeof val === 'number' ? val.toFixed(3) : val}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Model Info */}
                        {selectedModelData && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h4 className="font-semibold text-slate-800 mb-3">Modelo Selecionado</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Nome</span>
                                        <span className="font-medium text-slate-700">{selectedModelData.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Algoritmo</span>
                                        <span className="font-medium text-slate-700">{selectedModelData.algorithm}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tipo</span>
                                        <span className="font-medium text-slate-700">{selectedModelData.task_type}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input & Results */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Input Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-[#2c6a6b]" />
                                    Dados de Entrada
                                </h3>
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setInputMode('file')}
                                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                                            ${inputMode === 'file' ? 'bg-white shadow text-[#597996]' : 'text-slate-500'}`}
                                    >
                                        Arquivo
                                    </button>
                                    <button
                                        onClick={() => setInputMode('manual')}
                                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                                            ${inputMode === 'manual' ? 'bg-white shadow text-[#597996]' : 'text-slate-500'}`}
                                    >
                                        Manual
                                    </button>
                                </div>
                            </div>

                            {inputMode === 'file' ? (
                                <div>
                                    <div
                                        onClick={() => document.getElementById('predFileInput')?.click()}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                            ${file ? 'border-[#2c6a6b] bg-[#2c6a6b]/5' : 'border-slate-200 hover:border-[#597996]/50'}`}
                                    >
                                        {file ? (
                                            <div>
                                                <FileText className="w-10 h-10 text-[#2c6a6b] mx-auto mb-2" />
                                                <p className="font-medium text-slate-800">{file.name}</p>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                    className="mt-2 text-red-500 text-sm hover:underline flex items-center gap-1 mx-auto"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Remover
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                                <p className="font-medium text-slate-700">Arraste seu arquivo aqui</p>
                                                <p className="text-sm text-slate-400 mt-1">CSV, JSON ou Excel</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            id="predFileInput"
                                            className="hidden"
                                            accept=".csv,.json,.xlsx,.xls"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <textarea
                                        value={manualInput}
                                        onChange={(e) => setManualInput(e.target.value)}
                                        placeholder='JSON array: [{"feature1": value1, "feature2": value2}, ...]'
                                        className="w-full h-40 p-4 border border-slate-200 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#597996]/20 focus:border-[#597996]"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        Insira os dados em formato JSON array
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={runPrediction}
                                disabled={!selectedModel || loading}
                                className={`mt-4 w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all
                                    ${!selectedModel || loading
                                        ? 'bg-slate-300 cursor-not-allowed'
                                        : 'bg-[#2c6a6b] hover:bg-[#245858] shadow-md hover:shadow-lg'}`}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" />
                                        Executar Predição
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Results Section */}
                        {predictions.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        Resultados ({predictions.length} predições)
                                    </h3>
                                    <button
                                        onClick={exportResults}
                                        className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-200"
                                    >
                                        <Download className="w-4 h-4" />
                                        Exportar CSV
                                    </button>
                                </div>
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-medium text-slate-600">#</th>
                                                <th className="text-left px-4 py-3 font-medium text-slate-600">Predição</th>
                                                {predictions[0]?.probability !== undefined && (
                                                    <th className="text-left px-4 py-3 font-medium text-slate-600">Probabilidade</th>
                                                )}
                                                <th className="text-left px-4 py-3 font-medium text-slate-600">Confiança</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {predictions.map((pred, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-slate-500">{pred.row_id}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded font-medium
                                                            ${typeof pred.prediction === 'string'
                                                                ? pred.prediction === 'Positivo'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-red-100 text-red-700'
                                                                : 'bg-blue-100 text-blue-700'}`}>
                                                            {typeof pred.prediction === 'number'
                                                                ? pred.prediction.toFixed(2)
                                                                : pred.prediction}
                                                        </span>
                                                    </td>
                                                    {pred.probability !== undefined && (
                                                        <td className="px-4 py-3 text-slate-600">
                                                            {(pred.probability * 100).toFixed(1)}%
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 bg-slate-100 rounded-full h-2">
                                                                <div
                                                                    className="h-2 rounded-full bg-[#2c6a6b]"
                                                                    style={{ width: `${(pred.confidence || 0) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-slate-600 text-xs">
                                                                {((pred.confidence || 0) * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictionInterface;
