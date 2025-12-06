import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    XCircle,
    Clock,
    MessageSquare,
    ExternalLink,
    FileText
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
        <div className="h-full flex flex-col bg-white text-gray-900 p-6 overflow-hidden rounded-xl shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Central de Aprovações</h1>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    Pendentes
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'sent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    Enviados
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    Histórico
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center py-20 text-gray-400">Carregando...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        Nenhuma solicitação encontrada.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {requests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)}
                                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
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
                                            <h3 className="font-semibold text-gray-900">{req.title}</h3>
                                            <p className="text-xs text-gray-500">
                                                Enviado por {req.requester_name} em {new Date(req.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(req.status)}`}>
                                        {getStatusLabel(req.status)}
                                    </span>
                                </div>

                                {req.asset_url && (
                                    <div className="bg-gray-50 rounded-lg p-2 mb-3 flex items-center gap-3 border border-gray-100">
                                        {req.file_type?.startsWith('image/') ? (
                                            <img src={req.asset_url} alt="Preview" className="w-12 h-12 rounded object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 bg-white rounded border border-gray-200 flex items-center justify-center">
                                                <FileText size={20} className="text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm truncate text-gray-700">{req.asset_name}</p>
                                            <a
                                                href={req.asset_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                Ver Arquivo <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {req.notes && (
                                    <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded border border-gray-100 italic">
                                        "{req.notes}"
                                    </p>
                                )}

                                {req.reviewer_comments && (
                                    <div className="mt-2 text-sm text-gray-500 border-t border-gray-100 pt-2">
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
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">{selectedRequest.title}</h2>
                            <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-700">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Left: Preview */}
                            <div className="flex-1 bg-gray-100 p-6 flex items-center justify-center overflow-auto">
                                {selectedRequest.asset_url ? (
                                    selectedRequest.file_type?.startsWith('image/') ? (
                                        <img src={selectedRequest.asset_url} alt="Preview" className="max-w-full max-h-full rounded shadow-lg" />
                                    ) : (
                                        <div className="text-center">
                                            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                                            <p className="text-gray-600 mb-4">{selectedRequest.asset_name}</p>
                                            <a
                                                href={selectedRequest.asset_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 shadow-sm"
                                            >
                                                Download / Visualizar <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-gray-400">Nenhum arquivo anexado</div>
                                )}
                            </div>

                            {/* Right: Info & Actions */}
                            <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col">
                                <div className="p-6 flex-1 overflow-y-auto">
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Detalhes</h3>
                                        <p className="text-gray-900 font-medium">{selectedRequest.requester_name}</p>
                                        <p className="text-sm text-gray-500">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                        <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${getStatusColor(selectedRequest.status)}`}>
                                            {getStatusLabel(selectedRequest.status)}
                                        </div>
                                    </div>

                                    {selectedRequest.notes && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas</h3>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                {selectedRequest.notes}
                                            </p>
                                        </div>
                                    )}

                                    {activeTab === 'pending' && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Seu Feedback</h3>
                                            <textarea
                                                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                                                placeholder="Digite seus comentários aqui..."
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                            ></textarea>
                                        </div>
                                    )}

                                    {/* Magic Link for Sharing */}
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="text-xs text-blue-600 mb-2 font-medium">Link Público para Cliente:</p>
                                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                                            <code className="text-xs truncate flex-1 text-gray-600">
                                                {`${window.location.origin}/review/${selectedRequest.review_token}`}
                                            </code>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/review/${selectedRequest.review_token}`)}
                                                className="text-gray-400 hover:text-blue-600"
                                                title="Copiar Link"
                                            >
                                                <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {activeTab === 'pending' && (
                                    <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-3">
                                        <button
                                            onClick={() => handleReview('approved')}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <CheckCircle2 size={18} /> Aprovar
                                        </button>
                                        <button
                                            onClick={() => handleReview('changes_requested')}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <MessageSquare size={18} /> Solicitar Alterações
                                        </button>
                                        <button
                                            onClick={() => handleReview('rejected')}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
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
