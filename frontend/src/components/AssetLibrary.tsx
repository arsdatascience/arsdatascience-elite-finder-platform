import React, { useState, useEffect } from 'react';
import {
    Folder,
    File as FileIcon,
    Upload,
    Plus,
    Search,
    MoreVertical,
    Trash2,
    Download,
    ChevronRight,
    Home,
    Image,
    FileText,
    Video
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface Asset {
    id: number;
    name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    uploade_name?: string;
    created_at: string;
}

interface AssetFolder {
    id: number;
    name: string;
    parent_id?: number | null;
}

export const AssetLibrary: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [folders, setFolders] = useState<AssetFolder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<AssetFolder | null>(null);
    const [folderPath, setFolderPath] = useState<AssetFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    useEffect(() => {
        loadContent();
    }, [currentFolder]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const [foldersData, assetsData] = await Promise.all([
                apiClient.assets.listFolders({ parent_id: currentFolder?.id }),
                apiClient.assets.list({ folder_id: currentFolder?.id, search: searchTerm })
            ]);
            setFolders(foldersData);
            setAssets(assetsData);
        } catch (error) {
            console.error('Error loading library content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolder) {
            formData.append('folder_id', currentFolder.id.toString());
        }

        try {
            await apiClient.assets.upload(formData);
            await loadContent();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Erro ao fazer upload do arquivo.');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await apiClient.assets.createFolder({
                name: newFolderName,
                parent_id: currentFolder?.id
            });
            setNewFolderName('');
            setShowNewFolderModal(false);
            loadContent();
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const navigateToFolder = (folder: AssetFolder) => {
        setFolderPath([...folderPath, folder]);
        setCurrentFolder(folder);
    };

    const navigateUp = (index: number) => {
        if (index === -1) {
            setCurrentFolder(null);
            setFolderPath([]);
        } else {
            const newPath = folderPath.slice(0, index + 1);
            setCurrentFolder(newPath[newPath.length - 1]);
            setFolderPath(newPath);
        }
    };

    const handleDeleteAsset = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;
        try {
            await apiClient.assets.delete(id);
            loadContent();
        } catch (error) {
            console.error('Error deleting asset:', error);
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-purple-500" />;
        if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-red-500" />;
        if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-orange-500" />;
        return <FileIcon className="w-8 h-8 text-blue-500" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="h-full flex flex-col bg-[#0f172a] text-white p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Biblioteca Digital</h1>
                    <div className="flex items-center space-x-2 text-slate-400 text-sm">
                        <button
                            onClick={() => navigateUp(-1)}
                            className="hover:text-white flex items-center transition-colors"
                        >
                            <Home size={16} />
                        </button>
                        {folderPath.map((folder, idx) => (
                            <React.Fragment key={folder.id}>
                                <ChevronRight size={14} />
                                <button
                                    onClick={() => navigateUp(idx)}
                                    className="hover:text-white transition-colors"
                                >
                                    {folder.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar arquivos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadContent()}
                            className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 w-64"
                        />
                    </div>

                    <button
                        onClick={() => setShowNewFolderModal(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
                    >
                        <Plus size={18} />
                        Nova Pasta
                    </button>

                    <label className={`
                        bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}>
                        <Upload size={18} />
                        {uploading ? 'Enviando...' : 'Upload'}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-2">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-slate-400">
                        Carregando...
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Folders Section */}
                        {folders.length > 0 && (
                            <div>
                                <h2 className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider">Pastas</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {folders.map(folder => (
                                        <div
                                            key={folder.id}
                                            onClick={() => navigateToFolder(folder)}
                                            className="group bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-purple-500/50 hover:bg-slate-750 transition-all cursor-pointer flex flex-col items-center text-center gap-3"
                                        >
                                            <div className="p-3 bg-purple-500/10 rounded-full text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-110 transition-transform">
                                                <Folder size={32} fill="currentColor" fillOpacity={0.2} />
                                            </div>
                                            <span className="text-sm font-medium truncate w-full">{folder.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files Section */}
                        {assets.length > 0 ? (
                            <div>
                                <h2 className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider">Arquivos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {assets.map(asset => (
                                        <div
                                            key={asset.id}
                                            className="group bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 overflow-hidden transition-all flex flex-col"
                                        >
                                            {/* Preview / Icon Area */}
                                            <div className="h-32 bg-slate-900 flex items-center justify-center relative">
                                                {asset.file_type.startsWith('image/') ? (
                                                    <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <div className="transform group-hover:scale-110 transition-transform">
                                                        {getFileIcon(asset.file_type)}
                                                    </div>
                                                )}

                                                {/* Hover Actions */}
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={asset.file_url}
                                                        download
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 bg-slate-700 rounded-full hover:bg-blue-600 text-white transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download size={16} />
                                                    </a>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }}
                                                        className="p-2 bg-slate-700 rounded-full hover:bg-red-600 text-white transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* File Info */}
                                            <div className="p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-medium text-sm truncate flex-1 pr-2" title={asset.name}>{asset.name}</h3>
                                                    <button className="text-slate-400 hover:text-white">
                                                        <MoreVertical size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-500">
                                                    <span>{formatSize(asset.file_size)}</span>
                                                    <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            assets.length === 0 && folders.length === 0 && !loading && (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                                        <Folder size={40} />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-300 mb-2">Esta pasta está vazia</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto">
                                        Organize seus arquivos criando pastas ou faça upload de novos documentos.
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Nova Pasta</h3>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Nome da pasta"
                            autoFocus
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white mb-6 focus:outline-none focus:border-purple-500"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowNewFolderModal(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                            >
                                Criar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
