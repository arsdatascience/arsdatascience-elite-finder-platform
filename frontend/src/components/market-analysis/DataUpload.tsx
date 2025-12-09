import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, RefreshCw, Eye, BarChart3, Trash2, Database, Table as TableIcon } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

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
    statistics?: Record<string, any>; // [NEW] Added statistics field
    created_at: string;
}

interface ColumnStats {
    name: string;
    type: string;
    nullCount: number;
    uniqueCount: number;
    min?: number;
    max?: number;
    mean?: number;
}

export const DataUpload: React.FC = () => {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [previewTab, setPreviewTab] = useState<'table' | 'stats'>('table');

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = async () => {
        try {
            const data = await apiClient.marketAnalysis.getDatasets();
            // Ensure data is array to prevent map errors
            setDatasets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load datasets', err);
            setDatasets([]);
        }
    };

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
            } else {
                setError('Formato inválido. Use CSV, Excel, JSON ou Parquet.');
            }
        }
    }, []);

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.split('.')[0]);

        try {
            await apiClient.marketAnalysis.uploadDataset(formData);
            setFile(null);
            loadDatasets();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha no upload');
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

    return (
        <div className="min-h-screen bg-slate-50 p-6">
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
                    {/* Upload Section */}
                    <div className="lg:col-span-1 space-y-6">
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
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {selectedDataset ? (
                                <>
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

                                    {/* Preview Content */}
                                    {previewTab === 'table' ? (
                                        <div className="overflow-auto max-h-[500px]">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-100 sticky top-0">
                                                    <tr>
                                                        {selectedDataset.columns?.map((col, i) => (
                                                            <th key={i} className="px-4 py-3 text-left font-medium text-slate-700 whitespace-nowrap">
                                                                {col.name}
                                                                <span className="ml-1 text-xs text-slate-400">({col.type})</span>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedDataset.preview?.slice(0, 20).map((row, i) => (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            {selectedDataset.columns?.map((col, j) => (
                                                                <td key={j} className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                                                                    {row[col.name] ?? <span className="text-slate-300 italic">null</span>}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {(selectedDataset.preview?.length || 0) > 20 && (
                                                <p className="text-center text-sm text-slate-400 py-3">
                                                    Mostrando 20 de {selectedDataset.preview?.length} linhas do preview
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {selectedDataset.columns?.map((col, i) => {
                                                    const stats = selectedDataset.statistics?.[col.name] || {};
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
                                                                {(col.type === 'number' || col.type === 'integer' || col.type === 'float') && (
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
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
                                    <Eye className="w-12 h-12 mb-3" />
                                    <p className="font-medium">Selecione um dataset</p>
                                    <p className="text-sm">para visualizar dados e estatísticas</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
