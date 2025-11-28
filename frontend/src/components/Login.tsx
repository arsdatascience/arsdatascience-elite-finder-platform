import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowRight, ArrowLeft, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/services/apiClient';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Forgot Password State
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetStep, setResetStep] = useState<'email' | 'password'>('email');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Credenciais inválidas. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setForgotMessage('');

        try {
            const data = await apiClient.auth.forgotPassword(forgotEmail);

            if (data.success) {
                setForgotMessage(data.message);
                // Se o backend retornar o token (modo debug/sem email), avançar direto
                if (data.debugToken) {
                    setResetToken(data.debugToken);
                    setResetStep('password');
                }
            } else {
                setError(data.message || 'Erro ao solicitar recuperação.');
            }
        } catch (err) {
            setError('Erro de conexão ou email não encontrado.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const data = await apiClient.auth.resetPassword(resetToken, newPassword);
            if (data.success) {
                setForgotMessage('Senha alterada com sucesso! Redirecionando para login...');
                setTimeout(() => {
                    setShowForgot(false);
                    setResetStep('email');
                    setForgotMessage('');
                    setForgotEmail('');
                    setNewPassword('');
                }, 2000);
            } else {
                setError(data.error || 'Erro ao alterar senha.');
            }
        } catch (err) {
            setError('Erro ao resetar senha.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showForgot) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-8 md:p-10">
                        <button
                            onClick={() => setShowForgot(false)}
                            className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-1" /> Voltar
                        </button>

                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                                <Key size={24} />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Recuperar Senha</h1>
                            <p className="text-gray-500 mt-2">
                                {resetStep === 'email' ? 'Informe seu email para continuar' : 'Crie uma nova senha'}
                            </p>
                        </div>

                        {forgotMessage && (
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-6 text-center">
                                {forgotMessage}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center">
                                {error}
                            </div>
                        )}

                        {resetStep === 'email' ? (
                            <form onSubmit={handleForgot} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="seu@email.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Instruções'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetConfirm} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Nova senha segura"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Alterar Senha'}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                            <Lock size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
                        <p className="text-gray-500 mt-2">Acesse sua conta Elite Finder</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Entrar <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setShowForgot(true)}
                            className="text-sm text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                        >
                            Esqueceu sua senha?
                        </button>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t border-gray-100">
                    &copy; 2025 Elite Finder. Todos os direitos reservados.
                </div>
            </motion.div>
        </div>
    );
};
