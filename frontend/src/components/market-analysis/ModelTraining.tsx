import React, { useState, useEffect } from 'react';
import { Play, Activity, Database, Settings } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const ModelTraining: React.FC = () => {
    const [datasets, setDatasets] = useState<any[]>([]);
    const [experiments, setExperiments] = useState<any[]>([]);

    // Form State
    const [selectedDataset, setSelectedDataset] = useState('');
    const [name, setName] = useState('');
    const [taskType, setTaskType] = useState('regression');
    const [algorithm, setAlgorithm] = useState('linear_regression');
    const [targetColumn, setTargetColumn] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [ds, exps] = await Promise.all([
            apiClient.marketAnalysis.getDatasets(),
            apiClient.marketAnalysis.getExperiments()
        ]);
        setDatasets(ds);
        setExperiments(exps);
    };

    const handleTrain = async () => {
        if (!selectedDataset || !targetColumn) return;

        setLoading(true);
        try {
            // Find dataset to get columns (simplified)
            const ds = datasets.find(d => d.id === selectedDataset);
            const allColumns = ds ? JSON.parse(ds.columns).map((c: any) => c.name) : [];
            const features = allColumns.filter((c: string) => c !== targetColumn);

            await apiClient.marketAnalysis.createExperiment({
                datasetId: selectedDataset,
                name: name || `Experiment ${new Date().toLocaleTimeString()}`,
                algorithm,
                taskType,
                targetColumn,
                featureColumns: features, // By default use all other columns
                hyperparameters: { n_estimators: 100 } // Default for now
            });
            loadData();
            // Reset form
            setName('');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        Configure Training
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experiment Name</label>
                            <input
                                className="w-full p-2 border rounded-lg"
                                placeholder="My Sales Prediction Model"
                                value={name} onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dataset</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={selectedDataset} onChange={e => setSelectedDataset(e.target.value)}
                            >
                                <option value="">Select Dataset...</option>
                                {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={taskType} onChange={e => setTaskType(e.target.value)}
                            >
                                <option value="regression">Regression (Predict Number)</option>
                                <option value="classification">Classification (Predict Category)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={algorithm} onChange={e => setAlgorithm(e.target.value)}
                            >
                                {taskType === 'regression' ? (
                                    <>
                                        <option value="linear_regression">Linear Regression</option>
                                        <option value="decision_tree_regressor">Decision Tree</option>
                                        <option value="random_forest_regressor">Random Forest</option>
                                        <option value="xgboost_regressor">XGBoost Regressor</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="logistic_regression">Logistic Regression</option>
                                        <option value="decision_tree_classifier">Decision Tree</option>
                                        <option value="random_forest_classifier">Random Forest</option>
                                        <option value="xgboost_classifier">XGBoost Classifier</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Column (What to predict)</label>
                            <input
                                className="w-full p-2 border rounded-lg"
                                placeholder="e.g price, churned, sales"
                                value={targetColumn} onChange={e => setTargetColumn(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Must match a column name in your CSV exactly.</p>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleTrain}
                            disabled={loading || !selectedDataset}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors
                                ${loading || !selectedDataset ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            <Play className="w-4 h-4" />
                            {loading ? 'Starting...' : 'Start Training'}
                        </button>
                    </div>
                </div>
            </div>

            {/* History Panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Experiment History
                </h3>
                <div className="space-y-4">
                    {experiments.map((exp) => (
                        <div key={exp.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">{exp.name}</p>
                                    <p className="text-xs text-gray-500">{exp.algorithm}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${exp.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        exp.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {exp.status}
                                </span>
                            </div>
                            {exp.metrics && (
                                <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-2">
                                    {Object.entries(exp.metrics).map(([k, v]: [string, any]) => (
                                        <div key={k}><span className="font-semibold">{k}:</span> {typeof v === 'number' ? v.toFixed(3) : v}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {experiments.length === 0 && <p className="text-gray-400 text-center text-sm">No experiments yet.</p>}
                </div>
            </div>
        </div>
    );
};
