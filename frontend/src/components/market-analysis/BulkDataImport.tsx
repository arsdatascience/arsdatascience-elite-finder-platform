import React, { useState, useEffect } from 'react';
import {
    Upload, Database, FileSpreadsheet, CheckCircle, XCircle,
    AlertTriangle, Download, RefreshCw, ChevronDown, Eye, Loader2, Files
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface TableInfo {
    id: string;
    label: string;
    columns: string[];
    requiredColumns: string[];
    database: 'core' | 'ops';
}

interface PreviewData {
    tableName: string;
    tableLabel: string;
    totalRows: number;
    csvColumns: string[];
    tableColumns: string[];
    requiredColumns: string[];
    missingRequired: string[];
    sampleData: Record<string, any>[];
    isValid: boolean;
}

interface ImportResult {
    tableName: string;
    tableLabel: string;
    totalRows: number;
    inserted: number;
    failed: number;
    errors: { row: number; error: string }[];
}

interface BatchResult {
    file: string;
    tableName: string;
    database: string;
    totalRows: number;
    inserted: number;
    failed: number;
    errors: { row: number; error: string }[];
}

interface BatchImportResponse {
    success: boolean;
    totalFiles: number;
    processedFiles: number;
    failedFiles: number;
    importOrder: string[];
    results: BatchResult[];
    errors: { file: string; tableName: string; error: string }[];
}

export const BulkDataImport: React.FC = () => {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Batch mode state
    const [batchMode, setBatchMode] = useState(false);
    const [batchFiles, setBatchFiles] = useState<File[]>([]);
    const [batchResult, setBatchResult] = useState<BatchImportResponse | null>(null);

    useEffect(() => {
        loadTables();
    }, []);

    const loadTables = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.bulkImport.getTables();
            if (response.success) {
                setTables(response.tables);
            } else {
                setError('Falha ao carregar lista de tabelas');
            }
        } catch (err: any) {
            console.error('Failed to load tables:', err);
            setError('Falha ao carregar tabelas. O servidor pode estar reiniciando. Clique em "Tentar Novamente".');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(null);
            setResult(null);
            setError(null);
        }
    };

    const downloadTemplate = async () => {
        if (!selectedTable) return;

        try {
            const tableInfo = tables.find(t => t.id === selectedTable);
            const database = tableInfo?.database || 'core';
            const blob = await apiClient.bulkImport.getTemplate(selectedTable, database);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedTable}_template.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Failed to download template:', err);
            setError('Falha ao baixar template');
        }
    };

    const handlePreview = async () => {
        if (!file || !selectedTable) return;

        setPreviewing(true);
        setError(null);

        try {
            const tableInfo = tables.find(t => t.id === selectedTable);
            const database = tableInfo?.database || 'core';
            const response = await apiClient.bulkImport.preview(file, selectedTable, database);

            if (response.success) {
                setPreview(response.preview);
            } else {
                setError(response.error || 'Falha no preview');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha ao fazer preview');
        } finally {
            setPreviewing(false);
        }
    };

    const handleImport = async () => {
        if (!file || !selectedTable) return;

        setImporting(true);
        setError(null);

        try {
            const tableInfo = tables.find(t => t.id === selectedTable);
            const database = tableInfo?.database || 'core';
            const response = await apiClient.bulkImport.importData(file, selectedTable, database);

            if (response.success) {
                setResult(response.result);
                setPreview(null);
            } else {
                setError(response.error || 'Falha na importação');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha ao importar dados');
        } finally {
            setImporting(false);
        }
    };

    // Batch mode handlers
    const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            setBatchFiles(selectedFiles);
            setBatchResult(null);
            setError(null);
        }
    };

    const handleBatchImport = async () => {
        if (batchFiles.length === 0) return;

        setImporting(true);
        setError(null);

        try {
            const response = await apiClient.bulkImport.batchImport(batchFiles);

            if (response.success) {
                setBatchResult(response);
            } else {
                setError(response.error || 'Falha na importação em lote');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha ao importar dados em lote');
        } finally {
            setImporting(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
        setBatchFiles([]);
        setBatchResult(null);
        // Reset file inputs
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        const batchInput = document.getElementById('batch-csv-upload') as HTMLInputElement;
        if (batchInput) batchInput.value = '';
    };

    const selectedTableInfo = tables.find(t => t.id === selectedTable);

    return (
        <div className="space-y-6">
            {/* Header with Mode Toggle */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Upload className="w-7 h-7" />
                        <h2 className="text-2xl font-bold">Importação em Massa</h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setBatchMode(false); resetForm(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition ${!batchMode
                                ? 'bg-white text-emerald-600'
                                : 'bg-emerald-500 text-white hover:bg-emerald-400'
                                }`}
                        >
                            <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                            Arquivo Único
                        </button>
                        <button
                            onClick={() => { setBatchMode(true); resetForm(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition ${batchMode
                                ? 'bg-white text-emerald-600'
                                : 'bg-emerald-500 text-white hover:bg-emerald-400'
                                }`}
                        >
                            <Files className="w-4 h-4 inline mr-2" />
                            Múltiplos Arquivos
                        </button>
                    </div>
                </div>
                <p className="text-emerald-100">
                    {batchMode
                        ? 'Selecione múltiplos CSVs - cada arquivo será importado para a tabela correspondente (baseado no nome)'
                        : 'Importe um arquivo CSV para uma tabela específica do sistema'
                    }
                </p>
            </div>

            {/* BATCH MODE */}
            {batchMode && (
                <>
                    {/* Batch Upload */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Files className="w-5 h-5 text-emerald-600" />
                            1. Selecione Múltiplos Arquivos CSV
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            O nome de cada arquivo deve corresponder ao nome da tabela de destino (ex: <code className="bg-gray-100 px-1 rounded">ml_experiments.csv</code>)
                        </p>

                        <label
                            htmlFor="batch-csv-upload"
                            className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition block"
                        >
                            <input
                                id="batch-csv-upload"
                                type="file"
                                accept=".csv"
                                multiple
                                onChange={handleBatchFileChange}
                                className="hidden"
                            />
                            {batchFiles.length > 0 ? (
                                <div>
                                    <Files className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                                    <p className="font-medium text-emerald-600">{batchFiles.length} arquivo(s) selecionado(s)</p>
                                    <div className="mt-2 flex flex-wrap gap-2 justify-center">
                                        {batchFiles.map((f, idx) => (
                                            <span key={idx} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                                                {f.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    <Upload className="w-8 h-8 mx-auto mb-2" />
                                    <p>Clique para selecionar ou arraste arquivos CSV</p>
                                    <p className="text-xs mt-1">Até 50 arquivos de uma vez</p>
                                </div>
                            )}
                        </label>

                        {batchFiles.length > 0 && !batchResult && (
                            <button
                                onClick={handleBatchImport}
                                disabled={importing}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                                {importing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5" />
                                )}
                                Importar {batchFiles.length} Arquivo(s)
                            </button>
                        )}
                    </div>

                    {/* Batch Result */}
                    {batchResult && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                Resultado da Importação em Lote
                            </h3>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-800">{batchResult.totalFiles}</div>
                                    <div className="text-sm text-gray-500">Total de Arquivos</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{batchResult.processedFiles}</div>
                                    <div className="text-sm text-gray-500">Processados</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-red-600">{batchResult.failedFiles}</div>
                                    <div className="text-sm text-gray-500">Falharam</div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Ordem de importação:</strong> {batchResult.importOrder?.join(' → ')}
                            </p>

                            {/* Results per file */}
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {batchResult.results?.map((r, idx) => (
                                    <div key={idx} className={`p-3 rounded-lg ${r.failed === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-800">{r.file}</span>
                                            <span className="text-xs text-gray-500">→ {r.tableName} ({r.database})</span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            ✅ {r.inserted} inseridos | ❌ {r.failed} falhas | Total: {r.totalRows}
                                        </div>
                                        {r.errors?.length > 0 && (
                                            <div className="text-xs text-red-600 mt-1">
                                                {r.errors.slice(0, 2).map(e => `Linha ${e.row}: ${e.error}`).join('; ')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {batchResult.errors?.length > 0 && (
                                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                                    <p className="font-medium text-red-800 mb-1">Arquivos com erro:</p>
                                    {batchResult.errors.map((e, idx) => (
                                        <p key={idx} className="text-sm text-red-600">{e.file}: {e.error}</p>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={resetForm}
                                className="mt-4 flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Nova Importação
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* SINGLE FILE MODE */}
            {!batchMode && (
                <>
                    {/* Table Selection */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5 text-emerald-600" />
                            1. Selecione a Tabela de Destino
                        </h3>

                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Carregando tabelas...
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <select
                                        value={selectedTable}
                                        onChange={(e) => {
                                            setSelectedTable(e.target.value);
                                            resetForm();
                                        }}
                                        className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Selecione uma tabela...</option>
                                        {tables.map((table) => (
                                            <option key={table.id} value={table.id}>
                                                {table.label} ({table.id})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>

                                {selectedTable && (
                                    <button
                                        onClick={downloadTemplate}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                    >
                                        <Download className="w-5 h-5" />
                                        Baixar Template CSV
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Table Info */}
                        {selectedTableInfo && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-2">
                                    <strong>Colunas:</strong> {selectedTableInfo.columns.length}
                                </div>
                                {selectedTableInfo.requiredColumns.length > 0 && (
                                    <div className="text-sm text-amber-600">
                                        <strong>Obrigatórias:</strong> {selectedTableInfo.requiredColumns.join(', ')}
                                    </div>
                                )}
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {selectedTableInfo.columns.slice(0, 10).map((col) => (
                                        <span
                                            key={col}
                                            className={`text-xs px-2 py-1 rounded ${selectedTableInfo.requiredColumns.includes(col)
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {col}
                                        </span>
                                    ))}
                                    {selectedTableInfo.columns.length > 10 && (
                                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                                            +{selectedTableInfo.columns.length - 10} mais
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* File Upload */}
                    {selectedTable && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                2. Upload do Arquivo CSV
                            </h3>

                            <div className="flex items-center gap-4">
                                <label
                                    htmlFor="csv-upload"
                                    className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition"
                                >
                                    <input
                                        id="csv-upload"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {file ? (
                                        <div className="flex items-center justify-center gap-2 text-emerald-600">
                                            <FileSpreadsheet className="w-6 h-6" />
                                            <span className="font-medium">{file.name}</span>
                                            <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500">
                                            <Upload className="w-8 h-8 mx-auto mb-2" />
                                            <p>Clique para selecionar ou arraste um arquivo CSV</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {file && !preview && !result && (
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={handlePreview}
                                        disabled={previewing}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                    >
                                        {previewing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                        Preview Dados
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-800">Erro</p>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {preview && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-600" />
                                3. Preview dos Dados
                            </h3>

                            {/* Validation Status */}
                            <div className={`p-4 rounded-lg mb-4 ${preview.isValid ? 'bg-green-50' : 'bg-amber-50'}`}>
                                <div className="flex items-center gap-2">
                                    {preview.isValid ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    )}
                                    <span className={preview.isValid ? 'text-green-800' : 'text-amber-800'}>
                                        {preview.isValid
                                            ? `${preview.totalRows} registros prontos para importação`
                                            : `Colunas obrigatórias faltando: ${preview.missingRequired.join(', ')}`
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Column Mapping */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>Colunas no CSV:</strong> {preview.csvColumns.join(', ')}
                                </p>
                            </div>

                            {/* Sample Data */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            {preview.csvColumns.slice(0, 8).map((col) => (
                                                <th key={col} className="px-3 py-2 text-left font-medium text-gray-700">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.sampleData.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} className="border-b border-gray-100">
                                                {preview.csvColumns.slice(0, 8).map((col) => (
                                                    <td key={col} className="px-3 py-2 text-gray-600 truncate max-w-[200px]">
                                                        {String(row[col] || '-')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {preview.csvColumns.length > 8 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        +{preview.csvColumns.length - 8} colunas adicionais não exibidas
                                    </p>
                                )}
                            </div>

                            {/* Import Button */}
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={handleImport}
                                    disabled={importing || !preview.isValid}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                                >
                                    {importing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Upload className="w-5 h-5" />
                                    )}
                                    Importar {preview.totalRows} Registros
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className={`rounded-xl p-6 border shadow-sm ${result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                            }`}>
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                {result.failed === 0 ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                                )}
                                <span className={result.failed === 0 ? 'text-green-800' : 'text-amber-800'}>
                                    Importação Concluída
                                </span>
                            </h3>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-white rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-800">{result.totalRows}</div>
                                    <div className="text-sm text-gray-500">Total</div>
                                </div>
                                <div className="bg-white rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{result.inserted}</div>
                                    <div className="text-sm text-gray-500">Inseridos</div>
                                </div>
                                <div className="bg-white rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                                    <div className="text-sm text-gray-500">Falhas</div>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="bg-white rounded-lg p-4 mb-4">
                                    <p className="font-medium text-red-800 mb-2">Erros:</p>
                                    <ul className="text-sm text-red-600 space-y-1">
                                        {result.errors.slice(0, 5).map((err, idx) => (
                                            <li key={idx}>Linha {err.row}: {err.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={resetForm}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Nova Importação
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-800">Erro</p>
                        <p className="text-red-600 text-sm">{error}</p>
                        <button
                            onClick={loadTables}
                            className="mt-2 text-sm text-red-700 underline hover:text-red-800"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkDataImport;
