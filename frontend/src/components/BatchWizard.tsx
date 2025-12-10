import React, { useState } from 'react';
import { Calendar, Layers, Target, Wand2, ArrowRight, ArrowLeft } from 'lucide-react';

interface BatchWizardProps {
    onGenerate: (config: any) => void;
    loading: boolean;
    clientId?: number | null;
}

export const BatchWizard: React.FC<BatchWizardProps> = ({ onGenerate, loading, clientId }) => {
    const [step, setStep] = useState(1);
    const [days, setDays] = useState(5);
    const [topics, setTopics] = useState<string[]>(Array(5).fill(''));

    // Global Config
    const [platform, setPlatform] = useState('instagram');
    const [tone, setTone] = useState('persuasive');
    const [targetAudience, setTargetAudience] = useState({
        ageRange: '25-34',
        income: 'medium',
        interests: ''
    });

    const handleDaysChange = (val: number) => {
        setDays(val);
        setTopics(Array(val).fill(''));
    };

    const handleTopicChange = (index: number, val: string) => {
        const newTopics = [...topics];
        newTopics[index] = val;
        setTopics(newTopics);
    };

    const canAdvance = () => {
        if (step === 1) return days > 0;
        if (step === 2) return topics.every(t => t.trim().length > 3);
        return true;
    };

    const handleSubmit = () => {
        onGenerate({
            days,
            topics,
            platform,
            tone,
            targetAudience,
            clientId
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden max-w-4xl mx-auto animate-fade-in">
            {/* Header Steps */}
            <div className="bg-slate-50 border-b border-slate-200 p-6">
                <div className="flex justify-between items-center relative">
                    {/* Progress Bar Background */}
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-200 -z-0 rounded-full"></div>

                    {/* Step 1 */}
                    <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${step >= 1 ? 'bg-slate-800 shadow-lg shadow-slate-300' : 'bg-slate-400'}`}>
                            1
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase">Definir Dias</span>
                    </div>

                    {/* Step 2 */}
                    <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${step >= 2 ? 'bg-slate-800 shadow-lg shadow-slate-300' : 'bg-slate-400'}`}>
                            2
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase">Roteiro Diário</span>
                    </div>

                    {/* Step 3 */}
                    <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${step >= 3 ? 'bg-slate-800 shadow-lg shadow-slate-300' : 'bg-slate-400'}`}>
                            3
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase">Configuração</span>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-8 min-h-[400px]">

                {/* STEP 1: Number of Days */}
                {step === 1 && (
                    <div className="animate-fade-in space-y-8 text-center max-w-lg mx-auto">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-800">Quantos conteúdos vamos criar?</h2>
                            <p className="text-slate-500">Defina o período para geração em lote.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {[3, 5, 7, 15, 30].map(val => (
                                <button
                                    key={val}
                                    onClick={() => handleDaysChange(val)}
                                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${days === val
                                        ? 'border-slate-800 bg-slate-100 text-slate-900 shadow-md'
                                        : 'border-slate-100 hover:border-slate-400 hover:bg-slate-50'
                                        }`}
                                >
                                    <Calendar size={32} className={days === val ? 'text-slate-800' : 'text-slate-400'} />
                                    <span className="font-bold text-lg">{val} Dias</span>
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Ou personalize:</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={days}
                                onChange={(e) => handleDaysChange(Number(e.target.value))}
                                className="w-24 text-center text-xl font-bold text-slate-800 border-b-2 border-slate-300 focus:border-slate-800 outline-none p-2"
                            />
                        </div>
                    </div>
                )}

                {/* STEP 2: Topics per Day */}
                {step === 2 && (
                    <div className="animate-fade-in h-96 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Layers className="text-slate-800" /> Defina os Temas Diários
                            </h2>

                            {topics.map((topic, index) => (
                                <div key={index} className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-sm">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Dia</span>
                                        <span className="text-xl font-black text-slate-700">{index + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={topic}
                                            onChange={(e) => handleTopicChange(index, e.target.value)}
                                            placeholder={`Sobre o que será o post do dia ${index + 1}? Ex: Dicas para iniciantes...`}
                                            className="w-full border-0 bg-transparent focus:ring-0 text-slate-700 placeholder:text-slate-400 resize-none h-12"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: Configuration */}
                {step === 3 && (
                    <div className="animate-fade-in grid grid-cols-2 gap-8">
                        {/* Column 1 */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Plataforma</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-500"
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                >
                                    <option value="instagram">Instagram (Post/Reels)</option>
                                    <option value="linkedin">LinkedIn (Artigo/Post)</option>
                                    <option value="tiktok">TikTok (Roteiro)</option>
                                    <option value="blog">Blog (SEO)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tom de Voz</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['persuasive', 'professional', 'funny', 'urgent'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTone(t)}
                                            className={`p-2 rounded-lg border text-sm capitalize transition-all ${tone === t ? 'bg-slate-100 border-slate-800 text-slate-900 font-bold' : 'hover:bg-slate-50 border-slate-200'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Target size={18} /> Público Alvo
                            </h3>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Faixa Etária</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                                    value={targetAudience.ageRange}
                                    onChange={(e) => setTargetAudience({ ...targetAudience, ageRange: e.target.value })}
                                >
                                    <option value="18-24">18 - 24 anos (Jovens)</option>
                                    <option value="25-34">25 - 34 anos (Adultos)</option>
                                    <option value="35-44">35 - 44 anos (Meia idade)</option>
                                    <option value="45+">45+ anos (Seniors)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nível de Renda</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                                    value={targetAudience.income}
                                    onChange={(e) => setTargetAudience({ ...targetAudience, income: e.target.value })}
                                >
                                    <option value="low">Econômica</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta / Premium</option>
                                    <option value="luxury">Luxo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interesses Extras</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Tecnologia, Moda, Esportes..."
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                                    value={targetAudience.interests}
                                    onChange={(e) => setTargetAudience({ ...targetAudience, interests: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
                <button
                    onClick={() => step > 1 && setStep(step - 1)}
                    disabled={step === 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <ArrowLeft size={18} /> Voltar
                </button>

                {step < 3 ? (
                    <button
                        onClick={() => canAdvance() && setStep(step + 1)}
                        disabled={!canAdvance()}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Próximo <ArrowRight size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-xl font-bold hover:shadow-slate-300 shadow-xl transition-all scale-100 hover:scale-105"
                    >
                        {loading ? 'Processando Lote...' : 'Gerar Lote Completo'} <Wand2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};
