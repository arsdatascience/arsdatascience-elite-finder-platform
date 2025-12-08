import React, { useState, useEffect, useMemo } from 'react';
import { X, Settings2, Save, RotateCcw, Zap, Target, Database, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ALGORITHM_CONFIGS, getDefaultConfig, getPresetConfig, validateConfig, calculateEstimatedAccuracy } from '../../data/index';
import type { AlgorithmDefinition, HyperparameterDefinition } from '../../data/index';
import { apiClient } from '../../services/apiClient';

interface AlgorithmConfigModalProps {
    algorithmId: string;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (config: Record<string, any>) => void;
}

const AlgorithmConfigModal: React.FC<AlgorithmConfigModalProps> = ({
    algorithmId,
    isOpen,
    onClose,
    onSave
}) => {
    const [config, setConfig] = useState<Record<string, any>>({});
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [savedConfigId, setSavedConfigId] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['basic', 'regularization', 'tree', 'ensemble']));
    const [showAdvanced, setShowAdvanced] = useState(false);

    const algorithm = ALGORITHM_CONFIGS[algorithmId];

    // Load saved config or defaults
    useEffect(() => {
        if (algorithmId && algorithm) {
            loadConfig();
        }
    }, [algorithmId]);

    const loadConfig = async () => {
        try {
            const result = await apiClient.mlConfigs.getByAlgorithm(algorithmId);
            if (result.success && result.data) {
                setConfig(result.data.config || {});
                setSavedConfigId(result.data.id);
                setSelectedPreset(result.data.preset_name || 'custom');
            } else {
                // Load defaults
                setConfig(getDefaultConfig(algorithmId));
                setSelectedPreset('');
            }
        } catch {
            setConfig(getDefaultConfig(algorithmId));
            setSelectedPreset('');
        }
    };

    // Calculate accuracy and validation
    const { accuracy, tips } = useMemo(() => {
        return calculateEstimatedAccuracy(algorithmId, config);
    }, [algorithmId, config]);

    const validation = useMemo(() => {
        return validateConfig(algorithmId, config);
    }, [algorithmId, config]);

    // Group hyperparameters by category
    const groupedParams = useMemo(() => {
        if (!algorithm) return {};
        const groups: Record<string, HyperparameterDefinition[]> = {};
        algorithm.hyperparameters.forEach(hp => {
            const cat = hp.category;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(hp);
        });
        return groups;
    }, [algorithm]);

    const handlePresetChange = (presetName: string) => {
        setSelectedPreset(presetName);
        const presetConfig = getPresetConfig(algorithmId, presetName);
        if (presetConfig) {
            setConfig(presetConfig);
        }
    };

    const handleParamChange = (name: string, value: any) => {
        setConfig(prev => ({ ...prev, [name]: value }));
        setSelectedPreset('custom');
    };

    const handleReset = () => {
        setConfig(getDefaultConfig(algorithmId));
        setSelectedPreset('');
    };

    const handleSave = async () => {
        if (!algorithm) return;
        setIsSaving(true);
        try {
            if (savedConfigId) {
                await apiClient.mlConfigs.update(savedConfigId, {
                    config,
                    preset_name: selectedPreset || 'custom',
                    is_default: true
                });
            } else {
                const result = await apiClient.mlConfigs.create({
                    algorithm_id: algorithmId,
                    algorithm_name: algorithm.name,
                    algorithm_category: algorithm.category,
                    config,
                    preset_name: selectedPreset || 'custom',
                    is_default: true
                });
                if (result.success && result.data) {
                    setSavedConfigId(result.data.id);
                }
            }
            onSave?.(config);
        } catch (err) {
            console.error('Error saving config:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            basic: '🎯 Básico',
            regularization: '🛡️ Regularização',
            tree: '🌳 Árvore',
            ensemble: '🌲 Ensemble',
            optimization: '⚡ Otimização',
            advanced: '🔧 Avançado'
        };
        return labels[cat] || cat;
    };

    const renderParamInput = (hp: HyperparameterDefinition) => {
        const value = config[hp.name] ?? hp.default;

        if (hp.type === 'boolean') {
            return (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleParamChange(hp.name, true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${value === true
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        Sim
                    </button>
                    <button
                        onClick={() => handleParamChange(hp.name, false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${value === false
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        Não
                    </button>
                </div>
            );
        }

        if (hp.type === 'select' && hp.options) {
            return (
                <select
                    value={value ?? ''}
                    onChange={(e) => handleParamChange(hp.name, e.target.value === 'null' ? null : e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                    {hp.options.map(opt => (
                        <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }

        if (hp.type === 'number' || hp.type === 'integer') {
            const numValue = value === null ? '' : value;
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={hp.min ?? 0}
                            max={hp.max ?? 100}
                            step={hp.step ?? (hp.type === 'integer' ? 1 : 0.1)}
                            value={numValue || hp.min || 0}
                            onChange={(e) => {
                                const v = hp.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value);
                                handleParamChange(hp.name, v);
                            }}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <input
                            type="number"
                            min={hp.min}
                            max={hp.max}
                            step={hp.step ?? (hp.type === 'integer' ? 1 : 0.01)}
                            value={numValue}
                            onChange={(e) => {
                                const v = e.target.value === '' ? null :
                                    hp.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value);
                                handleParamChange(hp.name, v);
                            }}
                            className="w-24 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm text-center focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {hp.min !== undefined && hp.max !== undefined && (
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{hp.min}</span>
                            <span>{hp.max}</span>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    if (!isOpen || !algorithm) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-gray-700" style={{ width: '1000px', height: '900px' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/30 rounded-xl">
                            <Settings2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-white">{algorithm.name}</h2>
                                <span className="px-2 py-0.5 bg-blue-600/40 text-blue-300 text-xs font-bold rounded-full">v1.2</span>
                            </div>
                            <p className="text-sm text-gray-400">{algorithm.library}</p>
                        </div>
                    </div>
                    {/* Estimated Accuracy Display */}
                    <div className="flex items-center gap-4">
                        <div className="text-center px-4 py-2 bg-gray-900/70 rounded-xl border border-gray-600">
                            <p className="text-xs text-gray-400 mb-1">Acurácia Estimada</p>
                            <div className="flex items-center justify-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor: accuracyInfo.accuracy >= 0.90 ? '#22c55e' :
                                            accuracyInfo.accuracy >= 0.80 ? '#84cc16' :
                                                accuracyInfo.accuracy >= 0.70 ? '#eab308' : '#ef4444'
                                    }}
                                />
                                <span className="text-2xl font-bold text-white">
                                    {Math.round(accuracyInfo.accuracy * 100)}%
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Hyperparameters */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Presets */}
                            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    Presets
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {algorithm.presets.map(preset => (
                                        <button
                                            key={preset.name}
                                            onClick={() => handlePresetChange(preset.name)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedPreset === preset.name
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                }`}
                                            title={preset.description}
                                        >
                                            {preset.label}
                                            {preset.estimatedTime && (
                                                <span className="ml-2 text-xs opacity-70">{preset.estimatedTime}</span>
                                            )}
                                        </button>
                                    ))}
                                    {selectedPreset === 'custom' && (
                                        <span className="px-4 py-2 rounded-lg text-sm bg-purple-600/30 text-purple-300 border border-purple-500/50">
                                            Custom
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hyperparameters by Category */}
                            {Object.entries(groupedParams)
                                .filter(([cat]) => showAdvanced || cat !== 'advanced')
                                .map(([cat, params]) => (
                                    <div key={cat} className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
                                        <button
                                            onClick={() => toggleCategory(cat)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                                        >
                                            <span className="font-semibold text-gray-300">{getCategoryLabel(cat)}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{params.length} params</span>
                                                {expandedCategories.has(cat) ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </button>
                                        {expandedCategories.has(cat) && (
                                            <div className="p-4 pt-0 space-y-4">
                                                {params.map(hp => (
                                                    <div key={hp.name} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                                                {hp.label}
                                                                {hp.impact === 'high' && (
                                                                    <span className="text-xs px-2 py-0.5 bg-red-600/30 text-red-400 rounded">Alto Impacto</span>
                                                                )}
                                                            </label>
                                                            <span className="text-xs text-gray-500">default: {String(hp.default)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mb-2">{hp.description}</p>
                                                        {renderParamInput(hp)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                            {/* Toggle Advanced */}
                            {groupedParams['advanced'] && (
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full text-sm text-gray-400 hover:text-gray-300 py-2"
                                >
                                    {showAdvanced ? '▲ Ocultar Avançado' : '▼ Mostrar Avançado'}
                                </button>
                            )}
                        </div>

                        {/* Right Column - Stats */}
                        <div className="space-y-4">
                            {/* Accuracy Gauge */}
                            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-green-500" />
                                    Acurácia Estimada
                                </h3>
                                <div className="relative w-full h-32 flex items-center justify-center">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" fill="none" stroke="#374151" strokeWidth="8" />
                                        <circle
                                            cx="64" cy="64" r="56" fill="none"
                                            stroke={accuracy >= 0.85 ? '#10B981' : accuracy >= 0.75 ? '#F59E0B' : '#EF4444'}
                                            strokeWidth="8"
                                            strokeDasharray={`${accuracy * 352} 352`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-white">{Math.round(accuracy * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Data Requirements */}
                            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-purple-500" />
                                    Requisitos de Dados
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Amostras Mín:</span>
                                        <span className="text-white font-medium">{algorithm.dataRequirements.minSamples.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Amostras Ideal:</span>
                                        <span className="text-green-400 font-medium">{algorithm.dataRequirements.idealSamples.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Features Mín:</span>
                                        <span className="text-white font-medium">{algorithm.dataRequirements.minFeatures}</span>
                                    </div>
                                    {algorithm.dataRequirements.notes && (
                                        <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-800 rounded">
                                            💡 {algorithm.dataRequirements.notes}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Validation */}
                            {!validation.valid && (
                                <div className="bg-red-900/30 rounded-xl p-4 border border-red-700/50">
                                    <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Avisos
                                    </h3>
                                    <ul className="text-xs text-red-300 space-y-1">
                                        {validation.errors.map((err, i) => (
                                            <li key={i}>⚠️ {err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Tips */}
                            {tips.length > 0 && (
                                <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-700/50">
                                    <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        Dicas
                                    </h3>
                                    <ul className="text-xs text-yellow-300 space-y-1">
                                        {tips.map((tip, i) => (
                                            <li key={i}>💡 {tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-900/50">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Resetar
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !validation.valid}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Salvar Configuração
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlgorithmConfigModal;
