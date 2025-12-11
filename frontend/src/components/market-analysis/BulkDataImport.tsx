import React, { useState, useEffect } from 'react';
import {
    Upload, Database, FileSpreadsheet, CheckCircle, XCircle,
    AlertTriangle, Download, RefreshCw, ChevronDown, Eye, Loader2, Files,
    BookOpen, ChevronRight
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

interface LayerFileResult {
    file: string;
    tableName: string;
    database: string;
    totalRows: number;
    inserted: number;
    failed: number;
    transformations: number;
    errors: { row: number; error: string }[];
}

interface LayerResult {
    layer: number;
    layerName: string;
    files: LayerFileResult[];
    totalInserted: number;
    totalFailed: number;
    transformationsApplied: number;
}

interface BatchImportResponse {
    success: boolean;
    normalize: boolean;
    summary: {
        totalFiles: number;
        processedFiles: number;
        failedFiles: number;
        totalInserted: number;
        totalFailed: number;
        totalTransformations: number;
    };
    layerResults: LayerResult[];
    errors: { file: string; tableName: string; layer: string; error: string }[];
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
    const [showGuide, setShowGuide] = useState(false);

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

    // Drag and drop state
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);

        if (batchMode) {
            // Batch mode: accept multiple files
            const validFiles = droppedFiles.filter(f => f.name.match(/\.(csv|xlsx|xls|json)$/i));
            if (validFiles.length > 0) {
                setBatchFiles(validFiles);
                setBatchResult(null);
                setError(null);
            }
        } else {
            // Single mode: accept first valid file
            const validFile = droppedFiles.find(f => f.name.match(/\.(csv|xlsx|xls|json)$/i));
            if (validFile) {
                setFile(validFile);
                setPreview(null);
                setResult(null);
                setError(null);
            }
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
                        ? 'Selecione múltiplos arquivos (CSV, Excel, JSON) - cada arquivo será importado para a tabela correspondente'
                        : 'Importe um arquivo para uma tabela específica do sistema'
                    }
                </p>
            </div>

            {/* Import Order Guide */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition"
                >
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold text-gray-800">📋 Manual de Ordem de Importação</span>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">26 tabelas</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${showGuide ? 'rotate-90' : ''}`} />
                </button>

                {showGuide && (
                    <div className="p-6 space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-amber-800 font-medium mb-1">⚠️ Importante: Ordem de Importação</p>
                            <p className="text-sm text-amber-700">
                                Para evitar erros de <strong>Foreign Key</strong>, importe as tabelas na ordem abaixo.
                                Tabelas filhas dependem de tabelas pai - importar fora de ordem causará erros.
                            </p>
                        </div>

                        {/* ETL Normalization Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800 font-medium mb-2">🔧 Normalização ETL Automática</p>
                            <p className="text-sm text-blue-700 mb-3">
                                Os dados são normalizados automaticamente antes da inserção para evitar erros de formato:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                <div className="bg-white/50 p-2 rounded">
                                    <span className="font-medium">🔤 Strings:</span>
                                    <span className="text-blue-700"> Trim + remove caracteres invisíveis</span>
                                </div>
                                <div className="bg-white/50 p-2 rounded">
                                    <span className="font-medium">🔢 Números:</span>
                                    <span className="text-blue-700"> Limpa texto, converte int/float</span>
                                </div>
                                <div className="bg-white/50 p-2 rounded">
                                    <span className="font-medium">✅ Boolean:</span>
                                    <span className="text-blue-700"> true/false/sim/não/1/0</span>
                                </div>
                                <div className="bg-white/50 p-2 rounded">
                                    <span className="font-medium">📅 Datas:</span>
                                    <span className="text-blue-700"> DD/MM/YYYY → ISO</span>
                                </div>
                                <div className="bg-white/50 p-2 rounded">
                                    <span className="font-medium">📋 JSON:</span>
                                    <span className="text-blue-700"> Parse automático de arrays/objects</span>
                                </div>
                                <div className="bg-white/50 p-2 rounded">
                                    <span className="font-medium">🆔 UUID:</span>
                                    <span className="text-blue-700"> Validação de formato</span>
                                </div>
                            </div>
                        </div>

                        {/* Layer 0 - Infrastructure */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-full">0ª Camada</span>
                                Infraestrutura Global (Obrigatório)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                    { name: 'tenants.csv', desc: 'Tenants / Clientes', db: 'Crossover' },
                                    { name: 'projects.csv', desc: 'Projetos', db: 'Crossover' },
                                ].map(t => (
                                    <div key={t.name} className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center gap-3">
                                        <span className="text-lg">🏗️</span>
                                        <div>
                                            <code className="text-sm font-medium text-gray-900">{t.name}</code>
                                            <p className="text-xs text-gray-500">{t.desc} • {t.db}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Layer 1 - Base Tables */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 text-xs rounded-full">1ª Camada</span>
                                Tabelas Base (sem dependências)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                    { name: 'ml_industry_segments.csv', desc: 'Segmentos de indústria', db: 'Megalev' },
                                    { name: 'ml_prophet_holidays.csv', desc: 'Feriados para Prophet', db: 'Megalev' },
                                    { name: 'ml_datasets.csv', desc: 'Datasets de ML', db: 'Megalev' },
                                    { name: 'unified_customers.csv', desc: 'Clientes unificados (CDP)', db: 'Crossover' },
                                ].map(t => (
                                    <div key={t.name} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                                        <span className="text-lg">📄</span>
                                        <div>
                                            <code className="text-sm font-medium text-gray-900">{t.name}</code>
                                            <p className="text-xs text-gray-500">{t.desc} • {t.db}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Layer 2 - Depends on Datasets */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">2ª Camada</span>
                                Depende de: ml_datasets
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                    { name: 'ml_experiments.csv', desc: 'Experimentos de ML', db: 'Megalev' },
                                    { name: 'ml_algorithm_configs.csv', desc: 'Configurações de algoritmos', db: 'Megalev' },
                                ].map(t => (
                                    <div key={t.name} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                                        <span className="text-lg">📄</span>
                                        <div>
                                            <code className="text-sm font-medium text-gray-900">{t.name}</code>
                                            <p className="text-xs text-gray-500">{t.desc} • {t.db}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Layer 3 - Depends on Experiments */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">3ª Camada</span>
                                Depende de: ml_experiments
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {[
                                    { name: 'ml_predictions.csv', desc: 'Predições' },
                                    { name: 'ml_regression_results.csv', desc: 'Resultados regressão' },
                                    { name: 'ml_classification_results.csv', desc: 'Resultados classificação' },
                                    { name: 'ml_clustering_results.csv', desc: 'Resultados clustering' },
                                    { name: 'ml_timeseries_results.csv', desc: 'Resultados séries temporais' },
                                    { name: 'ml_sales_analytics.csv', desc: 'Analytics vendas' },
                                    { name: 'ml_marketing_analytics.csv', desc: 'Analytics marketing' },
                                    { name: 'ml_customer_analytics.csv', desc: 'Analytics clientes' },
                                    { name: 'ml_financial_analytics.csv', desc: 'Analytics financeiro' },
                                    { name: 'ml_segment_analytics.csv', desc: 'Analytics segmentos' },
                                ].map(t => (
                                    <div key={t.name} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                                        <span className="text-lg">📄</span>
                                        <div>
                                            <code className="text-xs font-medium text-gray-900">{t.name}</code>
                                            <p className="text-xs text-gray-500">{t.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Layer 4 - Visualization Tables */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded-full">4ª Camada</span>
                                Depende de: ml_*_results
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                    { name: 'ml_viz_regression.csv', desc: 'Visualizações regressão' },
                                    { name: 'ml_viz_classification.csv', desc: 'Visualizações classificação' },
                                    { name: 'ml_viz_clustering.csv', desc: 'Visualizações clustering' },
                                    { name: 'ml_viz_timeseries.csv', desc: 'Visualizações séries temporais' },
                                    { name: 'ml_algorithm_config_history.csv', desc: 'Histórico de configs' },
                                ].map(t => (
                                    <div key={t.name} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                                        <span className="text-lg">📊</span>
                                        <div>
                                            <code className="text-sm font-medium text-gray-900">{t.name}</code>
                                            <p className="text-xs text-gray-500">{t.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Layer 5 - Customer Journey Tables */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-rose-100 text-rose-800 px-2 py-1 text-xs rounded-full">5ª Camada</span>
                                Depende de: unified_customers
                            </h4>

                            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 mb-3 text-sm text-rose-800">
                                <p className="font-medium flex items-center gap-2">
                                    💡 Dica Extra (Ordem Interna):
                                </p>
                                <p className="mt-1">
                                    Se houver vínculo entre jornada e interação, a ordem segura é:
                                </p>
                                <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                                    <li><strong>customer_journeys.csv</strong> (Cria o container da jornada)</li>
                                    <li><strong>customer_interactions.csv</strong> (Insere os eventos dentro da jornada)</li>
                                </ol>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                    { name: 'customer_interactions.csv', desc: 'Interações omnichannel' },
                                    { name: 'customer_journeys.csv', desc: 'Jornadas do cliente' },
                                    { name: 'identity_graph.csv', desc: 'Grafo de identidades' },
                                    { name: 'journey_step_templates.csv', desc: 'Templates de steps' },
                                ].map(t => (
                                    <div key={t.name} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                                        <span className="text-lg">👥</span>
                                        <div>
                                            <code className="text-sm font-medium text-gray-900">{t.name}</code>
                                            <p className="text-xs text-gray-500">{t.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Layer 6 - Conversion Events */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-teal-100 text-teal-800 px-2 py-1 text-xs rounded-full">6ª Camada</span>
                                Depende de: customer_interactions
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                                    <span className="text-lg">💰</span>
                                    <div>
                                        <code className="text-sm font-medium text-gray-900">conversion_events.csv</code>
                                        <p className="text-xs text-gray-500">Eventos de conversão</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-100 rounded-lg p-4 mt-4">
                            <p className="font-medium text-gray-800 mb-2">📝 Resumo Rápido da Ordem:</p>
                            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                                <li><code className="bg-white px-1 rounded">tenants</code>, <code className="bg-white px-1 rounded">projects</code> <strong>(CRÍTICO)</strong></li>
                                <li><code className="bg-white px-1 rounded">ml_industry_segments</code>, <code className="bg-white px-1 rounded">ml_datasets</code>, <code className="bg-white px-1 rounded">unified_customers</code></li>
                                <li><code className="bg-white px-1 rounded">ml_experiments</code>, <code className="bg-white px-1 rounded">ml_algorithm_configs</code></li>
                                <li><code className="bg-white px-1 rounded">ml_*_results</code>, <code className="bg-white px-1 rounded">ml_*_analytics</code></li>
                                <li><code className="bg-white px-1 rounded">ml_viz_*</code>, <code className="bg-white px-1 rounded">ml_algorithm_config_history</code></li>
                                <li><code className="bg-white px-1 rounded">customer_interactions</code>, <code className="bg-white px-1 rounded">customer_journeys</code></li>
                                <li><code className="bg-white px-1 rounded">conversion_events</code></li>
                            </ol>
                        </div>
                    </div>
                )}
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
                        O nome de cada arquivo deve corresponder ao nome da tabela de destino (ex: <code className="bg-gray-100 px-1 rounded">ml_experiments.xlsx</code>)
                    </p>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <label
                            htmlFor="batch-csv-upload"
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition block ${isDragging
                                ? 'border-emerald-500 bg-emerald-100 scale-[1.02]'
                                : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
                                }`}
                        >
                            <input
                                id="batch-csv-upload"
                                type="file"
                                accept=".csv,.xlsx,.xls,.json"
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
                                    <p>Clique para selecionar ou arraste arquivos (CSV/Excel/JSON)</p>
                                    <p className="text-xs mt-1">Até 50 arquivos de uma vez</p>
                                </div>
                            )}
                        </label>
                    </div>

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
                        {batchResult.normalize && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">ETL Ativo</span>
                        )}
                    </h3>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-gray-800">{batchResult.summary.totalFiles}</div>
                            <div className="text-xs text-gray-500">Arquivos</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-green-600">{batchResult.summary.totalInserted}</div>
                            <div className="text-xs text-gray-500">Inseridos</div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-amber-600">{batchResult.summary.totalFailed}</div>
                            <div className="text-xs text-gray-500">Falhas</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-blue-600">{batchResult.summary.totalTransformations}</div>
                            <div className="text-xs text-gray-500">Transformações ETL</div>
                        </div>
                    </div>

                    {/* Layer Results */}
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {batchResult.layerResults?.map((layer) => (
                            <div key={layer.layer} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                            {layer.layer}
                                        </span>
                                        <span className="font-medium text-gray-700">{layer.layerName}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-green-600">✅ {layer.totalInserted}</span>
                                        <span className="text-amber-600">❌ {layer.totalFailed}</span>
                                        {layer.transformationsApplied > 0 && (
                                            <span className="text-blue-600">🔧 {layer.transformationsApplied}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {layer.files.map((f, idx) => (
                                        <div key={idx} className={`px-4 py-2 ${f.failed === 0 ? 'bg-white' : 'bg-amber-50'}`}>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-gray-800">{f.file}</span>
                                                <span className="text-xs text-gray-500">→ {f.tableName}</span>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {f.inserted}/{f.totalRows} inseridos
                                                {f.transformations > 0 && ` | ${f.transformations} transformações`}
                                                {f.failed > 0 && <span className="text-red-600 ml-2">| {f.failed} falhas</span>}
                                            </div>
                                            {/* Show first 5 errors if any */}
                                            {f.errors && f.errors.length > 0 && (
                                                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700 max-h-24 overflow-y-auto">
                                                    {f.errors.slice(0, 5).map((err: any, idx: number) => (
                                                        <div key={idx} className="mb-1">
                                                            <span className="font-medium">Linha {err.row}:</span> {err.error}
                                                        </div>
                                                    ))}
                                                    {f.errors.length > 5 && (
                                                        <div className="text-red-500 italic">...e mais {f.errors.length - 5} erros</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {batchResult.errors?.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg">
                            <p className="font-medium text-red-800 mb-1">Erros gerais:</p>
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
    )
}

{/* SINGLE FILE MODE */ }
{
    !batchMode && (
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
                        2. Upload do Arquivo
                    </h3>

                    <div
                        className="flex items-center gap-4"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <label
                            htmlFor="csv-upload"
                            className={`flex-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${isDragging
                                ? 'border-emerald-500 bg-emerald-100 scale-[1.02]'
                                : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
                                }`}
                        >
                            <input
                                id="csv-upload"
                                type="file"
                                accept=".csv,.xlsx,.json"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {file ? (
                                <div className="flex items-center justify-center gap-2 text-emerald-600">
                                    <FileSpreadsheet className="w-6 h-6" />
                                    <span className="font-medium">{file.name}</span>
                                    <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                            ) : isDragging ? (
                                <div className="text-emerald-600">
                                    <Upload className="w-8 h-8 mx-auto mb-2 animate-bounce" />
                                    <p className="font-medium">Solte o arquivo aqui!</p>
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    <Upload className="w-8 h-8 mx-auto mb-2" />
                                    <p>Clique para selecionar ou <strong>arraste</strong> um arquivo</p>
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
                                Preview
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={importing}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                                {importing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5" />
                                )}
                                Importar Direto
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
                            <strong>Colunas no Arquivo:</strong> {preview.csvColumns.join(', ')}
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
    )
}

{/* Error Display */ }
{
    error && (
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
    );
};

export default BulkDataImport;
