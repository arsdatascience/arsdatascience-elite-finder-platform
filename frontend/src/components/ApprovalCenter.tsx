import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    XCircle,
    Clock,
    MessageSquare,
    ExternalLink,
    FileText,
    Image,
    Video,
    Send
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface ApprovalRequest {
    id: number;
    title: string;
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
    notes?: string;
    asset_name?: string;
    asset_url?: string;
    file_type?: string;
    requester_name: string;
    created_at: string;
    reviewer_comments?: string;
    review_token: string;
}

export const ApprovalCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'history'>('pending');
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [reviewComment, setReviewComment] = useState('');

    useEffect(() => {
        loadRequests();
    }, [activeTab]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await apiClient.approvals.list(activeTab);
            setRequests(data);
        } catch (error) {
            console.error('Error loading approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (status: 'approved' | 'rejected' | 'changes_requested') => {
        if (!selectedRequest) return;

        try {
            await apiClient.approvals.review(selectedRequest.id, status, reviewComment);
            setSelectedRequest(null);
            setReviewComment('');
            loadRequests();
        } catch (error) {
            console.error('Error reviewing request:', error);
            alert('Erro ao processar aprovação.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'changes_requested': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Aprovado';
            case 'rejected': return 'Rejeitado';
            case 'changes_requested': return 'Alterações Solicitadas';
            default: return 'Pendente';
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0f172a] text-white p-6 overflow-hidden">
            <h1 className="text-2xl font-bold mb-6">Central de Aprovações</h1>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'pending' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Pendentes
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'sent' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Enviados
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Histórico
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center py-20 text-slate-400">Carregando...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        Nenhuma solicitação encontrada.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {requests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)}
                                className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-purple-500/50 cursor-pointer transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${getStatusColor(req.status)}`}>
                                            {req.status === 'approved' ? <CheckCircle2 size={20} /> :
                                                req.status === 'rejected' ? <XCircle size={20} /> :
                                                    req.status === 'changes_requested' ? <MessageSquare size={20} /> :
                                                        <Clock size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{req.title}</h3>
                                            <p className="text-xs text-slate-400">
                                                Enviado por {req.requester_name} em {new Date(req.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(req.status)}`}>
                                        {getStatusLabel(req.status)}
                                    </span>
                                </div>

                                {req.asset_url && (
                                    <div className="bg-slate-900 rounded-lg p-2 mb-3 flex items-center gap-3">
                                        {req.file_type?.startsWith('image/') ? (
                                            <img src={req.asset_url} alt="Preview" className="w-12 h-12 rounded object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                                                <FileText size={20} className="text-slate-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm truncate">{req.asset_name}</p>
                                            <a
                                                href={req.asset_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                                            >
                                                Ver Arquivo <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {req.notes && (
                                    <p className="text-sm text-slate-300 mb-3 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                        "{req.notes}"
                                    </p>
                                )}

                                {req.reviewer_comments && (
                                    <div className="mt-2 text-sm text-slate-400 border-t border-slate-700 pt-2">
                                        <strong>Feedback:</strong> {req.reviewer_comments}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Detail / Review */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                            <h2 className="text-xl font-bold">{selectedRequest.title}</h2>
                            <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-white">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Left: Preview */}
                            <div className="flex-1 bg-black/50 p-6 flex items-center justify-center overflow-auto">
                                {selectedRequest.asset_url ? (
                                    selectedRequest.file_type?.startsWith('image/') ? (
                                        <img src={selectedRequest.asset_url} alt="Preview" className="max-w-full max-h-full rounded shadow-lg" />
                                    ) : (
                                        <div className="text-center">
                                            <FileText size={64} className="mx-auto text-slate-500 mb-4" />
                                            <p className="text-slate-300 mb-4">{selectedRequest.asset_name}</p>
                                            <a
                                                href={selectedRequest.asset_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2"
                                            >
                                                Download / Visualizar <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-slate-500">Nenhum arquivo anexado</div>
                                )}
                            </div>

                            {/* Right: Info & Actions */}
                            <div className="w-full md:w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
                                <div className="p-6 flex-1 overflow-y-auto">
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Detalhes</h3>
                                        <p className="text-white font-medium">{selectedRequest.requester_name}</p>
                                        <p className="text-sm text-slate-400">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                        <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${getStatusColor(selectedRequest.status)}`}>
                                            {getStatusLabel(selectedRequest.status)}
                                        </div>
                                    </div>

                                    {selectedRequest.notes && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Notas</h3>
                                            <p className="text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-700">
                                                {selectedRequest.notes}
                                            </p>
                                        </div>
                                    )}

                                    {activeTab === 'pending' && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Seu Feedback</h3>
                                            <textarea
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                                                placeholder="Digite seus comentários aqui..."
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                            ></textarea>
                                        </div>
                                    )}

                                    {/* Magic Link for Sharing */}
                                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                        <p className="text-xs text-slate-400 mb-2">Link Público para Cliente:</p>
                                        <div className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/10">
                                            <code className="text-xs truncate flex-1 text-blue-400">
                                                {`${window.location.origin}/review/${selectedRequest.review_token}`}
                                            </code>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/review/${selectedRequest.review_token}`)}
                                                className="text-slate-400 hover:text-white"
                                                title="Copiar Link"
                                            >
                                                <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {activeTab === 'pending' && (
                                    <div className="p-6 border-t border-slate-700 bg-slate-900 space-y-3">
                                        <button
                                            onClick={() => handleReview('approved')}
                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={18} /> Aprovar
                                        </button>
                                        <button
                                            onClick={() => handleReview('changes_requested')}
                                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare size={18} /> Solicitar Alterações
                                        </button>
                                        <button
                                            onClick={() => handleReview('rejected')}
                                            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} /> Rejeitar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
