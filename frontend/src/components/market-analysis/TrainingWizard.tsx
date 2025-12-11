import React, { useState, useEffect } from 'react';
import {
    ChevronRight, ChevronLeft, Database, Cpu, Target, Settings,
    Play, Check, AlertCircle, LineChart, GitBranch, Layers, Clock
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface Dataset {
    id: string;
    name: string;
    row_count: number;
    column_count: number;
    columns: { name: string; type: string }[];
}

interface AlgorithmInfo {
    id: string;
    name: string;
    category: 'regression' | 'classification' | 'clustering' | 'timeseries';
    description: string;
    complexity: 'low' | 'medium' | 'high';
    estimatedTime: string;
}

const ALGORITHMS: AlgorithmInfo[] = [
    // Regression
    { id: 'linear_regression', name: 'Linear Regression', category: 'regression', description: 'Modelo linear simples e interpretável', complexity: 'low', estimatedTime: '< 1 min' },
    { id: 'ridge', name: 'Ridge Regression', category: 'regression', description: 'Regressão com regularização L2', complexity: 'low', estimatedTime: '< 1 min' },
    { id: 'lasso', name: 'Lasso Regression', category: 'regression', description: 'Regressão com regularização L1', complexity: 'low', estimatedTime: '< 1 min' },
    { id: 'random_forest_reg', name: 'Random Forest', category: 'regression', description: 'Ensemble de árvores de decisão', complexity: 'medium', estimatedTime: '2-5 min' },
    { id: 'xgboost_reg', name: 'XGBoost', category: 'regression', description: 'Gradient boosting otimizado', complexity: 'high', estimatedTime: '5-15 min' },
    { id: 'lightgbm_reg', name: 'LightGBM', category: 'regression', description: 'Gradient boosting rápido', complexity: 'high', estimatedTime: '3-10 min' },
    // Classification
    { id: 'logistic_regression', name: 'Logistic Regression', category: 'classification', description: 'Classificação binária/multiclasse', complexity: 'low', estimatedTime: '< 1 min' },
    { id: 'decision_tree', name: 'Decision Tree', category: 'classification', description: 'Árvore de decisão interpretável', complexity: 'low', estimatedTime: '< 1 min' },
    { id: 'random_forest_clf', name: 'Random Forest', category: 'classification', description: 'Ensemble robusto', complexity: 'medium', estimatedTime: '2-5 min' },
    { id: 'xgboost_clf', name: 'XGBoost', category: 'classification', description: 'Alta performance em competições', complexity: 'high', estimatedTime: '5-15 min' },
    { id: 'svm', name: 'SVM', category: 'classification', description: 'Support Vector Machine', complexity: 'medium', estimatedTime: '2-10 min' },
    // Clustering
    { id: 'kmeans', name: 'K-Means', category: 'clustering', description: 'Agrupamento por centróides', complexity: 'low', estimatedTime: '< 2 min' },
    { id: 'dbscan', name: 'DBSCAN', category: 'clustering', description: 'Clustering baseado em densidade', complexity: 'medium', estimatedTime: '2-5 min' },
    // Time Series
    { id: 'prophet', name: 'Prophet', category: 'timeseries', description: 'Previsão do Facebook', complexity: 'medium', estimatedTime: '3-10 min' },
    { id: 'arima', name: 'ARIMA', category: 'timeseries', description: 'Modelo autorregressivo', complexity: 'medium', estimatedTime: '2-5 min' },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    regression: <LineChart className="w-5 h-5" />,
    classification: <GitBranch className="w-5 h-5" />,
    clustering: <Layers className="w-5 h-5" />,
    timeseries: <Clock className="w-5 h-5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
    regression: 'Regressão',
    classification: 'Classificação',
    clustering: 'Clustering',
    timeseries: 'Séries Temporais',
};

const PRESETS = [
    { id: 'quick', name: 'Rápido', description: 'Treinamento veloz para testes', icon: '⚡' },
    { id: 'balanced', name: 'Balanceado', description: 'Equilíbrio entre velocidade e precisão', icon: '⚖️' },
    { id: 'precise', name: 'Preciso', description: 'Máxima precisão, mais demorado', icon: '🎯' },
];

export const TrainingWizard: React.FC = () => {
    const [step, setStep] = useState(1);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [targetColumn, setTargetColumn] = useState<string | null>(null);
    const [featureColumns, setFeatureColumns] = useState<string[]>([]);
    const [experimentName, setExperimentName] = useState('');
    const [selectedPreset, setSelectedPreset] = useState('balanced');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hyperparameters state (simplified)
    const [hyperparams, setHyperparams] = useState({
        n_estimators: 100,
        max_depth: 6,
        learning_rate: 0.1,
        test_size: 0.2,
    });

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = async () => {
        try {
            const data = await apiClient.marketAnalysis.getDatasets();
            setDatasets(data || []);
        } catch (err) {
            console.error('Failed to load datasets', err);
        }
    };

    const currentDataset = datasets.find(d => d.id === selectedDataset);
    const currentAlgorithm = ALGORITHMS.find(a => a.id === selectedAlgorithm);

    const filteredAlgorithms = categoryFilter
        ? ALGORITHMS.filter(a => a.category === categoryFilter)
        : ALGORITHMS;

    const canProceed = () => {
        switch (step) {
            case 1: return !!selectedDataset;
            case 2: return !!selectedAlgorithm;
            case 3: return !!targetColumn && featureColumns.length > 0;
            case 4: return true;
            case 5: return experimentName.trim().length > 0;
            default: return false;
        }
    };

    const handleSubmit = async () => {
        if (!selectedDataset || !selectedAlgorithm || !targetColumn) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await apiClient.marketAnalysis.createExperiment({
                name: experimentName,
                dataset_id: selectedDataset,
                algorithm: selectedAlgorithm,
                task_type: currentAlgorithm?.category || 'classification',
                target_column: targetColumn,
                feature_columns: featureColumns,
                hyperparameters: hyperparams,
                test_size: hyperparams.test_size,
            });

            // Reset and show success - in real app would navigate to experiments
            alert('Experimento criado com sucesso! O treinamento foi iniciado.');
            setStep(1);
            setSelectedDataset(null);
            setSelectedAlgorithm(null);
            setTargetColumn(null);
            setFeatureColumns([]);
            setExperimentName('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha ao criar experimento');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleFeature = (col: string) => {
        if (col === targetColumn) return;
        setFeatureColumns(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    const selectAllFeatures = () => {
        const cols = currentDataset?.columns
            .map(c => c.name)
            .filter(c => c !== targetColumn) || [];
        setFeatureColumns(cols);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Cpu className="w-7 h-7 text-[#2c6a6b]" />
                        Novo Treinamento
                    </h1>
                    <p className="text-slate-500 mt-1">Configure e inicie o treinamento de um modelo personalizado</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {[
                        { num: 1, label: 'Dataset', icon: Database },
                        { num: 2, label: 'Algoritmo', icon: Cpu },
                        { num: 3, label: 'Features', icon: Target },
                        { num: 4, label: 'Parâmetros', icon: Settings },
                        { num: 5, label: 'Revisar', icon: Play },
                    ].map((s, i) => (
                        <React.Fragment key={s.num}>
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                                    ${step > s.num
                                        ? 'bg-emerald-500 text-white'
                                        : step === s.num
                                            ? 'bg-[#2c6a6b] text-white shadow-lg'
                                            : 'bg-slate-200 text-slate-500'}`}
                                >
                                    {step > s.num ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${step >= s.num ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < 4 && (
                                <div className={`flex-1 h-1 mx-2 rounded ${step > s.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    {/* Step 1: Select Dataset */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Selecione o Dataset</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {datasets.map(ds => (
                                    <div
                                        key={ds.id}
                                        onClick={() => setSelectedDataset(ds.id)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                                            ${selectedDataset === ds.id
                                                ? 'border-[#2c6a6b] bg-[#2c6a6b]/5'
                                                : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Database className={`w-8 h-8 ${selectedDataset === ds.id ? 'text-[#2c6a6b]' : 'text-slate-400'}`} />
                                            <div>
                                                <p className="font-medium text-slate-800">{ds.name}</p>
                                                <p className="text-sm text-slate-500">
                                                    {ds.row_count?.toLocaleString()} linhas • {ds.column_count} colunas
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {datasets.length === 0 && (
                                    <div className="col-span-2 text-center py-8 text-slate-400">
                                        Nenhum dataset disponível. Faça upload primeiro.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Algorithm */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Escolha o Algoritmo</h2>

                            {/* Category Filters */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                    onClick={() => setCategoryFilter(null)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                        ${!categoryFilter ? 'bg-[#2c6a6b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Todos
                                </button>
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => setCategoryFilter(key)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors
                                            ${categoryFilter === key ? 'bg-[#2c6a6b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {CATEGORY_ICONS[key]}
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                                {filteredAlgorithms.map(algo => (
                                    <div
                                        key={algo.id}
                                        onClick={() => setSelectedAlgorithm(algo.id)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                                            ${selectedAlgorithm === algo.id
                                                ? 'border-[#2c6a6b] bg-[#2c6a6b]/5'
                                                : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {CATEGORY_ICONS[algo.category]}
                                                <span className="font-medium text-slate-800">{algo.name}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium
                                                ${algo.complexity === 'low' ? 'bg-green-100 text-green-700' :
                                                    algo.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'}`}>
                                                {algo.complexity === 'low' ? 'Rápido' : algo.complexity === 'medium' ? 'Médio' : 'Pesado'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-2">{algo.description}</p>
                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {algo.estimatedTime}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Select Features */}
                    {step === 3 && currentDataset && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Selecione Target e Features</h2>

                            {/* Target Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Variável Target (o que prever)
                                </label>
                                <select
                                    value={targetColumn || ''}
                                    onChange={(e) => {
                                        setTargetColumn(e.target.value);
                                        setFeatureColumns(prev => prev.filter(c => c !== e.target.value));
                                    }}
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2c6a6b] focus:border-transparent"
                                >
                                    <option value="">Selecione uma coluna</option>
                                    {currentDataset.columns.map(col => (
                                        <option key={col.name} value={col.name}>
                                            {col.name} ({col.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Feature Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Features (variáveis de entrada)
                                    </label>
                                    <button
                                        onClick={selectAllFeatures}
                                        className="text-sm text-[#2c6a6b] hover:underline"
                                    >
                                        Selecionar todas
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto p-2 border border-slate-200 rounded-lg">
                                    {currentDataset.columns.map(col => (
                                        <label
                                            key={col.name}
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
                                                ${col.name === targetColumn
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : featureColumns.includes(col.name)
                                                        ? 'bg-[#2c6a6b]/10 text-[#2c6a6b]'
                                                        : 'hover:bg-slate-50'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={featureColumns.includes(col.name)}
                                                onChange={() => toggleFeature(col.name)}
                                                disabled={col.name === targetColumn}
                                                className="w-4 h-4 rounded text-[#2c6a6b] focus:ring-[#2c6a6b]"
                                            />
                                            <span className="text-sm">{col.name}</span>
                                            <span className="text-xs text-slate-400">({col.type})</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-sm text-slate-500 mt-2">
                                    {featureColumns.length} de {currentDataset.columns.length - (targetColumn ? 1 : 0)} features selecionadas
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Hyperparameters */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Configure os Parâmetros</h2>

                            {/* Presets */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setSelectedPreset(preset.id)}
                                        className={`p-4 rounded-lg border-2 text-center transition-all
                                            ${selectedPreset === preset.id
                                                ? 'border-[#2c6a6b] bg-[#2c6a6b]/5'
                                                : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <span className="text-2xl">{preset.icon}</span>
                                        <p className="font-medium text-slate-800 mt-2">{preset.name}</p>
                                        <p className="text-xs text-slate-500">{preset.description}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Parameters */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Número de Estimadores: {hyperparams.n_estimators}
                                    </label>
                                    <input
                                        type="range"
                                        min={10}
                                        max={500}
                                        step={10}
                                        value={hyperparams.n_estimators}
                                        onChange={(e) => setHyperparams(p => ({ ...p, n_estimators: +e.target.value }))}
                                        className="w-full accent-[#2c6a6b]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Profundidade Máxima: {hyperparams.max_depth}
                                    </label>
                                    <input
                                        type="range"
                                        min={2}
                                        max={20}
                                        value={hyperparams.max_depth}
                                        onChange={(e) => setHyperparams(p => ({ ...p, max_depth: +e.target.value }))}
                                        className="w-full accent-[#2c6a6b]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Learning Rate: {hyperparams.learning_rate}
                                    </label>
                                    <input
                                        type="range"
                                        min={0.01}
                                        max={1}
                                        step={0.01}
                                        value={hyperparams.learning_rate}
                                        onChange={(e) => setHyperparams(p => ({ ...p, learning_rate: +e.target.value }))}
                                        className="w-full accent-[#2c6a6b]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tamanho do Teste: {Math.round(hyperparams.test_size * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min={0.1}
                                        max={0.4}
                                        step={0.05}
                                        value={hyperparams.test_size}
                                        onChange={(e) => setHyperparams(p => ({ ...p, test_size: +e.target.value }))}
                                        className="w-full accent-[#2c6a6b]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review & Submit */}
                    {step === 5 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Revisar e Iniciar</h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Nome do Experimento
                                </label>
                                <input
                                    type="text"
                                    value={experimentName}
                                    onChange={(e) => setExperimentName(e.target.value)}
                                    placeholder="Ex: Previsão de Vendas Q1 2024"
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2c6a6b] focus:border-transparent"
                                />
                            </div>

                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Dataset:</span>
                                    <span className="font-medium">{currentDataset?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Algoritmo:</span>
                                    <span className="font-medium">{currentAlgorithm?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Target:</span>
                                    <span className="font-medium">{targetColumn}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Features:</span>
                                    <span className="font-medium">{featureColumns.length} colunas</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Preset:</span>
                                    <span className="font-medium capitalize">{selectedPreset}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                        <button
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
                                ${step === 1
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Voltar
                        </button>

                        {step < 5 ? (
                            <button
                                onClick={() => setStep(s => Math.min(5, s + 1))}
                                disabled={!canProceed()}
                                className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all
                                    ${canProceed()
                                        ? 'bg-[#2c6a6b] text-white hover:bg-[#245858] shadow-md'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                Próximo
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!canProceed() || isSubmitting}
                                className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all
                                    ${canProceed() && !isSubmitting
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                {isSubmitting ? 'Iniciando...' : 'Iniciar Treinamento'}
                                <Play className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
