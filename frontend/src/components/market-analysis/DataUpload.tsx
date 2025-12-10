import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, RefreshCw, Eye, BarChart3, Trash2, Database, Table as TableIcon } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface Dataset {
    id: string;
    name: string;
    description?: string;
    file_name: string;
    file_type: string;
    file_size: number;
    row_count: number;
    column_count: number;
    columns: { name: string; type: string }[];
    preview: Record<string, any>[];
    status: string;
    statistics?: Record<string, any>;
    created_at: string;
}

export const DataUpload: React.FC = () => {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [previewTab, setPreviewTab] = useState<'table' | 'stats'>('table');
    const [debugLog, setDebugLog] = useState<any>(null); // New Debug State

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = async () => {
        try {
            const response = await apiClient.marketAnalysis.getDatasets();
            // Robust check: Ensure response is an array
            const safeData = Array.isArray(response) ? response : (response?.data || []);
            setDatasets(Array.isArray(safeData) ? safeData : []);
            setDebugLog(prev => ({ ...prev, lastLoad: 'Success', count: safeData.length }));
        } catch (err: any) {
            console.error('Failed to load datasets', err);
            setDatasets([]);
            setDebugLog(prev => ({ ...prev, lastLoad: 'Error', error: err.message }));
        }
    };

    // ... (rest of handleDrop, handleUpload, formatFileSize, formatDate same as before)
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const f = droppedFiles[0];
            const validTypes = ['.csv', '.xlsx', '.xls', '.json', '.parquet'];
            const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
            if (validTypes.includes(ext)) {
                setFile(f);
                setError(null);
                setDebugLog({ action: 'File Dropped', file: f.name, size: f.size });
            } else {
                setError('Formato inválido. Use CSV, Excel, JSON ou Parquet.');
                setDebugLog({ action: 'File Rejected', reason: 'Invalid Type', ext });
            }
        }
    }, []);

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setDebugLog({ action: 'Upload Started', file: file.name });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.split('.')[0]);

        try {
            const res = await apiClient.marketAnalysis.uploadDataset(formData);
            setFile(null);
            setDebugLog({ action: 'Upload Success', response: res });
            loadDatasets();
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Falha no upload';
            const errorDetails = err.response?.data?.details || err.message;
            setError(errorMsg);
            setDebugLog({ action: 'Upload Failed', error: errorMsg, details: errorDetails, fullError: err.response?.data });
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Safe render helpers
    const renderTable = () => {
        if (!selectedDataset) return null;

        const cols = Array.isArray(selectedDataset.columns) ? selectedDataset.columns : [];
        const rows = Array.isArray(selectedDataset.preview) ? selectedDataset.preview : [];

        if (cols.length === 0) return <div className="p-8 text-center text-slate-400">Sem colunas definidas</div>;

        return (
            <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 sticky top-0">
                        <tr>
                            {cols.map((col, i) => (
                                <th key={i} className="px-4 py-3 text-left font-medium text-slate-700 whitespace-nowrap">
                                    {col.name}
                                    <span className="ml-1 text-xs text-slate-400">({col.type})</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.slice(0, 20).map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                {cols.map((col, j) => (
                                    <td key={j} className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                                        {row[col.name] !== undefined && row[col.name] !== null
                                            ? String(row[col.name])
                                            : <span className="text-slate-300 italic">null</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <Database className="w-12 h-12 text-slate-200 mb-3" />
                        <h4 className="font-medium text-slate-600 mb-1">Prévia de linhas indisponível</h4>
                        <p className="text-sm text-slate-400 max-w-xs">
                            Este dataset é antigo e não possui linhas salvas para pré-visualização.
                            <br />
                            <span className="text-emerald-600 font-medium">As Estatísticas funcionam normalmente.</span>
                        </p>
                    </div>
                )}
                {rows.length > 20 && (
                    <p className="text-center text-sm text-slate-400 py-3">
                        Mostrando 20 de {rows.length} linhas do preview
                    </p>
                )}
            </div>
        );
    };

    const renderStats = () => {
        if (!selectedDataset) return null;

        const cols = Array.isArray(selectedDataset.columns) ? selectedDataset.columns : [];
        const statsObj = selectedDataset.statistics || {};

        return (
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cols.map((col, i) => {
                        const stats = statsObj[col.name] || {};
                        return (
                            <div key={i} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-slate-800">{col.name}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                                    ${col.type === 'number'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'}`}>
                                        {col.type}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm text-slate-600">
                                    <div className="flex justify-between">
                                        <span>Valores únicos</span>
                                        <span className="font-medium">{stats.unique !== undefined ? stats.unique : '--'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Nulos</span>
                                        <span className="font-medium">{stats.null_count !== undefined ? stats.null_count : '--'}</span>
                                    </div>
                                    {['number', 'integer', 'float'].includes(col.type) && (
                                        <>
                                            <div className="flex justify-between">
                                                <span>Min / Max</span>
                                                <span className="font-medium">
                                                    {stats.min !== undefined ? Number(stats.min).toFixed(2) : '--'} / {stats.max !== undefined ? Number(stats.max).toFixed(2) : '--'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Média</span>
                                                <span className="font-medium">{stats.mean !== undefined ? Number(stats.mean).toFixed(2) : '--'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <ErrorBoundary name="DataUpload">
            <div className="min-h-screen bg-slate-50 p-6">
                {/* ... (Kept Header and Upload/List Layout structure mostly same, just updating render calls) */}
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <Database className="w-7 h-7 text-[#597996]" />
                            Gerenciamento de Dados
                        </h1>
                        <p className="text-slate-500 mt-1">Upload, visualize e gerencie seus datasets para treinamento de modelos</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Upload & List Section */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Upload Box */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-[#597996]" />
                                    Upload Dataset
                                </h2>

                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('fileInput')?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer
                                        ${dragging ? 'border-[#597996] bg-[#597996]/5' : 'border-slate-200 hover:border-[#597996]/50 hover:bg-slate-50'}`}
                                >
                                    <Upload className={`w-10 h-10 mb-3 ${dragging ? 'text-[#597996]' : 'text-slate-400'}`} />
                                    {file ? (
                                        <div className="text-center">
                                            <p className="font-medium text-slate-800">{file.name}</p>
                                            <p className="text-sm text-slate-500 mt-1">{formatFileSize(file.size)}</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                className="mt-2 text-red-500 text-sm hover:underline flex items-center gap-1 mx-auto"
                                            >
                                                <Trash2 className="w-3 h-3" /> Remover
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="font-medium text-slate-700">Arraste seu arquivo aqui</p>
                                            <p className="text-sm text-slate-400 mt-1">ou clique para selecionar</p>
                                            <p className="text-xs text-slate-400 mt-3">CSV, Excel, JSON, Parquet (máx. 100MB)</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="fileInput"
                                        accept=".csv,.xlsx,.xls,.json,.parquet"
                                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                    />
                                </div>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className={`mt-4 w-full py-2.5 rounded-lg text-white font-medium transition-all
                                        ${!file || uploading
                                            ? 'bg-slate-300 cursor-not-allowed'
                                            : 'bg-[#597996] hover:bg-[#4a6a86] shadow-md hover:shadow-lg'}`}
                                >
                                    {uploading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Processando...
                                        </span>
                                    ) : 'Fazer Upload'}
                                </button>
                            </div>

                            {/* Dataset List */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-800">Datasets Disponíveis</h3>
                                    <button onClick={loadDatasets} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                        <RefreshCw className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {datasets.map((ds) => (
                                        <div
                                            key={ds.id}
                                            onClick={() => setSelectedDataset(ds)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all
                                                ${selectedDataset?.id === ds.id
                                                    ? 'border-[#597996] bg-[#597996]/5 shadow-sm'
                                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText className={`w-5 h-5 ${selectedDataset?.id === ds.id ? 'text-[#597996]' : 'text-slate-400'}`} />
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">{ds.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {ds.row_count?.toLocaleString()} linhas • {ds.column_count} colunas
                                                        </p>
                                                    </div>
                                                </div>
                                                {ds.status === 'validated' && <Check className="w-4 h-4 text-emerald-500" />}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">{formatDate(ds.created_at)}</p>
                                        </div>
                                    ))}
                                    {datasets.length === 0 && (
                                        <div className="text-center py-8">
                                            <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                            <p className="text-slate-400 text-sm">Nenhum dataset ainda</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                                {selectedDataset ? (
                                    <ErrorBoundary name="DatasetPreview">
                                        {/* Preview Header */}
                                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">{selectedDataset.name}</h3>
                                                    <p className="text-sm text-slate-500">
                                                        {selectedDataset.row_count?.toLocaleString()} linhas × {selectedDataset.column_count} colunas
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setPreviewTab('table')}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors
                                                            ${previewTab === 'table'
                                                                ? 'bg-[#597996] text-white'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                    >
                                                        <TableIcon className="w-4 h-4" />
                                                        Dados
                                                    </button>
                                                    <button
                                                        onClick={() => setPreviewTab('stats')}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors
                                                            ${previewTab === 'stats'
                                                                ? 'bg-[#597996] text-white'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                    >
                                                        <BarChart3 className="w-4 h-4" />
                                                        Estatísticas
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        {previewTab === 'table' ? renderTable() : renderStats()}
                                    </ErrorBoundary>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Eye className="w-12 h-12 mb-3" />
                                        <p className="font-medium">Selecione um dataset</p>
                                        <p className="text-sm">para visualizar dados e estatísticas</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* DEBUG SECTION */}
                <div className="mt-8 p-4 bg-slate-900 rounded-xl overflow-x-auto text-xs text-green-400 font-mono border border-slate-700">
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider">Debug Info (Remover em Produção)</h4>

                    {/* ACTION LOGS */}
                    {debugLog && (
                        <div className="mb-4 pb-4 border-b border-slate-700">
                            <h5 className="text-yellow-400 font-bold mb-1">📢 Última Ação / Upload Log:</h5>
                            <pre className="bg-black/30 p-2 rounded text-blue-300 overflow-auto max-h-40">
                                {JSON.stringify(debugLog, null, 2)}
                            </pre>
                        </div>
                    )}

                    <p className="text-slate-400 mb-2">Selecione um dataset acima para ver seus dados brutos aqui.</p>
                    {selectedDataset ? (
                        <pre>{JSON.stringify({
                            id: selectedDataset.id,
                            row_count: selectedDataset.row_count,
                            columnsType: Array.isArray(selectedDataset.columns) ? 'Array' : typeof selectedDataset.columns,
                            columnsSample: selectedDataset.columns,
                            previewType: Array.isArray(selectedDataset.preview) ? 'Array' : typeof selectedDataset.preview,
                            previewLength: selectedDataset.preview?.length,
                            previewSample: selectedDataset.preview?.slice(0, 1),
                            statsType: typeof selectedDataset.statistics,
                            statsKeys: Object.keys(selectedDataset.statistics || {})
                        }, null, 2)}</pre>
                    ) : (
                        <span className="text-slate-500">Nenhum dataset selecionado.</span>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <h5 className="text-white mb-1">Raw Dataset Dump:</h5>
                        <pre className="opacity-50 max-h-40 overflow-auto">{JSON.stringify(selectedDataset, null, 2)}</pre>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};
