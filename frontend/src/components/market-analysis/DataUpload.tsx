import React, { useState, useEffect } from 'react';
import { Upload, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface Dataset {
    id: string;
    name: string;
    description?: string;
    file_name: string;
    row_count: number;
    status: string;
    created_at: string;
}

export const DataUpload: React.FC = () => {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = async () => {
        try {
            const data = await apiClient.marketAnalysis.getDatasets();
            setDatasets(data);
        } catch (err) {
            console.error('Failed to load datasets', err);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.split('.')[0]); // Default name

        try {
            await apiClient.marketAnalysis.uploadDataset(formData);
            setFile(null);
            loadDatasets();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-indigo-600" />
                        Upload Dataset
                    </h2>

                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
                            ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                        <Upload className={`w-12 h-12 mb-4 ${dragging ? 'text-indigo-600' : 'text-gray-400'}`} />
                        {file ? (
                            <div className="text-center">
                                <p className="text-lg font-medium text-gray-800">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="mt-2 text-red-500 text-sm hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-lg font-medium text-gray-700">Drop CSV or Excel file here</p>
                                <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                                <input
                                    type="file"
                                    className="hidden"
                                    id="fileInput"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                />
                                <label htmlFor="fileInput" className="absolute inset-0 cursor-pointer"></label>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className={`px-6 py-2 rounded-lg text-white font-medium transition-colors
                                ${!file || uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {uploading ? 'Uploading...' : 'Upload Data'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">Recent Datasets</h3>
                    <button onClick={loadDatasets} className="p-1 hover:bg-gray-100 rounded-full">
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="space-y-3">
                    {datasets.map((ds) => (
                        <div key={ds.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{ds.name}</p>
                                        <p className="text-xs text-gray-500">{ds.row_count} rows • {ds.file_name}</p>
                                    </div>
                                </div>
                                {ds.status === 'validated' && <Check className="w-4 h-4 text-green-500" />}
                            </div>
                        </div>
                    ))}
                    {datasets.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">No datasets uploaded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
