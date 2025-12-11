import React, { useState, useEffect } from 'react';
import { ContentRequest, ContentResult } from '../types';
import { generateMarketingContent } from '../services/geminiService';
import { saveSocialPost } from '../services/socialService';
import { Sparkles, X, Copy, Loader2, Image as ImageIcon, Hash, MousePointerClick, Bot, Cpu, Calendar as CalendarIcon, UploadCloud, CheckCircle, UserCircle, Building2 } from 'lucide-react';
import { CLIENTS_LIST } from '../constants';
import { COMPONENT_VERSIONS } from '../componentVersions';
import { AIProvider, AI_MODELS, OpenAIModel, GeminiModel } from '@/constants/aiModels';
import { apiClient } from '../services/apiClient';

interface ContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ContentRequest['type'];
  defaultPlatform?: ContentRequest['platform'];
  mode?: 'modal' | 'page';
  onSave?: (data: any) => void;
  initialData?: any;
}

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  avatar?: string;
}

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  isOpen,
  onClose,
  defaultType = 'post',
  defaultPlatform = 'instagram',
  mode = 'modal',
  onSave,
  initialData,
}) => {
  const [type, setType] = useState<ContentRequest['type']>(defaultType);
  const [platform, setPlatform] = useState<ContentRequest['platform']>(defaultPlatform);
  const [tone, setTone] = useState<'professional' | 'persuasive' | 'urgent' | 'friendly'>('persuasive');
  const [provider, setProvider] = useState<AIProvider>(AIProvider.GEMINI);
  const [model, setModel] = useState<string>(GeminiModel.GEMINI_2_5_FLASH);
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<ContentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Scheduling & Media States
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Account Selection
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || defaultType);
      setPlatform(initialData.platform || defaultPlatform);
      setTopic(initialData.content || '');
    }
  }, [initialData, defaultType, defaultPlatform]);

  // Update default model when provider changes
  useEffect(() => {
    if (provider === AIProvider.OPENAI) {
      setModel(OpenAIModel.GPT_5);
    } else {
      setModel(GeminiModel.GEMINI_2_5_FLASH);
    }
  }, [provider]);

  // Load Mock Accounts based on Client
  useEffect(() => {
    // Default to first real client if none selected
    if (!selectedClient && CLIENTS_LIST.length > 1) {
      setSelectedClient(CLIENTS_LIST[1].id); // Skip 'all'
    }
  }, []);

  useEffect(() => {
    if (!selectedClient) return;

    // Simulate fetching accounts for the selected client
    // In production: /api/clients/${selectedClient}/social-accounts
    const getMockAccounts = (clientId: string) => {
      const clientName = CLIENTS_LIST.find(c => c.id === clientId)?.name || 'Client';
      const suffix = clientId === '1' ? 'Official' : clientId === '2' ? 'Padaria' : 'Consultoria';

      return [
        { id: `${clientId}_1`, platform: 'instagram', username: `@${suffix.toLowerCase().replace(/\s/g, '')}`, avatar: `https://i.pravatar.cc/150?u=${clientId}_ig` },
        { id: `${clientId}_2`, platform: 'facebook', username: `${clientName} FB`, avatar: `https://i.pravatar.cc/150?u=${clientId}_fb` },
        { id: `${clientId}_3`, platform: 'linkedin', username: `${clientName} LinkedIn`, avatar: `https://i.pravatar.cc/150?u=${clientId}_li` },
      ];
    };

    const accounts = getMockAccounts(selectedClient);
    setSocialAccounts(accounts);
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0].id);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (galleryOpen) {
      apiClient.imageGeneration.list(50, 1).then(res => {
        setGalleryImages(res.images || []);
      });
    }
  }, [galleryOpen]);

  const handleSelectFromGallery = (url: string) => {
    setSelectedImageUrl(url);
    setImagePreview(url);
    setSelectedImage(null);
    setGalleryOpen(false);
  };

  if (!isOpen && mode === 'modal') return null;

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const res = await generateMarketingContent({
        type,
        platform,
        tone,
        topic,
        provider: provider as 'gemini' | 'openai',
        model
      });
      setResult(res);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar conteúdo. Verifique as chaves de API nas configurações.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAndSchedule = async () => {
    if (!result) return;
    setSaving(true);

    // Debug log
    console.log('Saving post with params:', {
      type,
      platform,
      scheduledDate,
      scheduledTime,
      addToCalendar,
      selectedAccount
    });

    try {
      const postData = {
        type,
        platform,
        content: result.body,
        scheduledDate,
        scheduledTime,
        addToCalendar,
        image: selectedImage,
        imageUrl: selectedImageUrl,
        clientId: selectedClient,
        accountId: selectedAccount // Include selected account
      };

      if (addToCalendar) {
        if (!scheduledDate || !scheduledTime) {
          alert('Por favor, selecione uma data e hora para agendar.');
          setSaving(false);
          return;
        }
        await saveSocialPost(postData);
        alert(`✅ Post salvo e agendado com sucesso para ${scheduledDate} às ${scheduledTime}!`);
      } else {
        if (onSave) onSave(postData);
        alert('Post salvo localmente!');
      }

      onClose();
    } catch (error) {
      console.error('Save Error:', error);
      alert('Erro ao salvar o post. Verifique o console para mais detalhes.');
    } finally {
      setSaving(false);
    }
  };

  const containerClasses = mode === 'modal'
    ? "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    : "h-[calc(100vh-6rem)] flex flex-col animate-fade-in";

  const innerClasses = mode === 'modal'
    ? "bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
    : "bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden";

  return (
    <div className={containerClasses}>
      <div className={innerClasses}>

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/10 rounded-lg">
              <Sparkles className="text-gray-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Estúdio Criativo IA <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2">{COMPONENT_VERSIONS.ContentGenerator}</span></h3>
              <p className="text-gray-400 text-sm">Criação, Agendamento e Design</p>
            </div>
          </div>
          {mode === 'modal' && (
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {!result ? (
            <div className="space-y-5 max-w-3xl mx-auto w-full">

              {/* AI Engine Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Escolha o Motor de Inteligência</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setProvider(AIProvider.GEMINI)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${provider === AIProvider.GEMINI
                      ? 'border-slate-500 bg-slate-50'
                      : 'border-gray-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className={`p-2 rounded-lg ${provider === AIProvider.GEMINI ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Bot size={20} />
                    </div>
                    <div className="text-left">
                      <span className={`block text-sm font-bold ${provider === AIProvider.GEMINI ? 'text-slate-900' : 'text-gray-600'}`}>Google Gemini</span>
                      <span className="text-xs text-gray-500">Recomendado</span>
                    </div>
                    {provider === AIProvider.GEMINI && <div className="ml-auto w-2 h-2 bg-slate-700 rounded-full"></div>}
                  </button>

                  <button
                    onClick={() => setProvider(AIProvider.OPENAI)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${provider === AIProvider.OPENAI
                      ? 'border-slate-500 bg-slate-50'
                      : 'border-gray-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className={`p-2 rounded-lg ${provider === AIProvider.OPENAI ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Cpu size={20} />
                    </div>
                    <div className="text-left">
                      <span className={`block text-sm font-bold ${provider === AIProvider.OPENAI ? 'text-slate-900' : 'text-gray-600'}`}>OpenAI GPT</span>
                      <span className="text-xs text-gray-500">Modelo Avançado</span>
                    </div>
                    {provider === AIProvider.OPENAI && <div className="ml-auto w-2 h-2 bg-teal-600 rounded-full"></div>}
                  </button>
                </div>

                {/* Model Selector */}
                <div className="mt-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modelo</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none bg-white"
                  >
                    {AI_MODELS[provider].map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-px bg-gray-100"></div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Conteúdo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-500 outline-none bg-white"
                  >
                    <option value="ad">Anúncio Pago (Ads)</option>
                    <option value="post">Post Orgânico (Feed)</option>
                    <option value="reels">Reels / TikTok (Roteiro)</option>
                    <option value="stories">Stories (Sequência)</option>
                    <option value="carousel">Carrossel (Slide a Slide)</option>
                    <option value="poll">Enquete Interativa</option>
                    <option value="article">Artigo / Blog Post</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plataforma</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-500 outline-none bg-white"
                  >
                    <option value="google">Google Ads</option>
                    <option value="meta">Meta (FB/IG)</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="tiktok">TikTok</option>
                    <option value="blog">Blog / Site</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tom de Voz</label>
                <div className="flex gap-2 flex-wrap">
                  {['professional', 'persuasive', 'urgent', 'friendly'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t as any)}
                      className={`px-3 py-1.5 rounded-full text-sm capitalize border ${tone === t
                        ? 'bg-gray-100 border-gray-500 text-gray-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {t === 'professional' ? 'Profissional' :
                        t === 'persuasive' ? 'Persuasivo' :
                          t === 'urgent' ? 'Urgente' : 'Amigável'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sobre o que você quer escrever?
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Roteiro de vídeo para lançamento de produto..."
                  className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-slate-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{topic.length} caracteres</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in max-w-3xl mx-auto w-full">

              {/* Engine Badge */}
              <div className="flex justify-end">
                <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${provider === AIProvider.GEMINI ? 'bg-slate-100 text-slate-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                  {provider === AIProvider.GEMINI ? <Bot size={12} /> : <Cpu size={12} />}
                  Gerado por {provider === AIProvider.GEMINI ? 'Gemini' : 'GPT'}
                </span>
              </div>

              {/* Headlines Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              </div>

              {/* Main Copy Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  {type === 'reels' ? 'Roteiro do Vídeo' : type === 'carousel' ? 'Estrutura dos Slides' : 'Conteúdo Gerado'}
                </h4>
                <p className="text-gray-800 whitespace-pre-line leading-relaxed">{result.body}</p>
              </div>

              {/* Extras Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-1">
                    <Hash size={14} /> Hashtags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {result.hashtags.map(tag => (
                      <span key={tag} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-slate-600 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-1">
                    <MousePointerClick size={14} /> Call to Action
                  </h4>
                  <p className="text-sm font-bold text-gray-800">{result.cta}</p>
                </div>
              </div>

              {/* Image Idea */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3 items-start">
                <ImageIcon className="text-slate-500 shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1 uppercase">Sugestão Visual (IA)</h4>
                  <p className="text-sm text-slate-700 italic">"{result.imageIdea}"</p>
                </div>
              </div>

              {/* --- NEW: SCHEDULING & MEDIA UPLOAD --- */}
              <div className="w-full border-t border-gray-100 pt-6 mt-6">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-gray-600" /> Agendamento e Publicação
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Date, Time & Account */}
                  <div className="space-y-4">

                    {/* Client & Account Selector */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente (Usuário)</label>
                        <div className="relative">
                          <select
                            className="w-full border border-gray-300 rounded-lg p-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                          >
                            {CLIENTS_LIST.filter(c => c.id !== 'all').map(client => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                          <Building2 size={18} className="absolute left-2.5 top-2.5 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Conta de Publicação</label>
                        <div className="relative">
                          <select
                            className="w-full border border-gray-300 rounded-lg p-2.5 pl-9 text-sm outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                          >
                            {socialAccounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.username} ({acc.platform})
                              </option>
                            ))}
                          </select>
                          <UserCircle size={18} className="absolute left-2.5 top-2.5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora</label>
                        <input
                          type="time"
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          className="rounded text-gray-600 focus:ring-slate-500 w-4 h-4"
                          checked={addToCalendar}
                          onChange={(e) => setAddToCalendar(e.target.checked)}
                        />
                        <span className="font-medium">Agendar no Calendário</span>
                      </label>
                    </div>
                  </div>

                  {/* Media Upload */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mídia (Imagem/Vídeo)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:bg-gray-50 transition-colors text-center relative group h-[180px] flex flex-col items-center justify-center">
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*,video/*"
                        onChange={handleImageUpload}
                      />
                      {imagePreview ? (
                        <div className="relative h-full w-full">
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <p className="text-white text-xs font-bold">Alterar Mídia</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <UploadCloud size={32} className="mb-2" />
                          <p className="text-sm font-medium">Arraste ou clique</p>
                          <p className="text-xs">JPG, PNG, MP4</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          {result ? (
            <button
              onClick={() => setResult(null)}
              className="text-gray-600 font-medium px-4 py-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Voltar
            </button>
          ) : (
            mode === 'modal' && (
              <button onClick={onClose} className="text-gray-500 font-medium px-4 py-2 hover:text-gray-700">
                Cancelar
              </button>
            )
          )}

          {!result && (
            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all text-white ${loading || !topic
                ? 'bg-gray-400 cursor-not-allowed'
                : provider === AIProvider.GEMINI
                  ? 'bg-slate-700 hover:bg-slate-800 shadow-lg shadow-slate-200'
                  : 'bg-slate-700 hover:bg-slate-800 shadow-lg shadow-slate-200'
                }`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles />}
              {loading ? 'Criando...' : `Gerar com ${provider === AIProvider.GEMINI ? 'Gemini' : 'GPT'}`}
            </button>
          )}

          {result && (
            <button
              className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-black transition-colors flex items-center gap-2"
              onClick={() => {
                navigator.clipboard.writeText(result.body);
                alert('Conteúdo copiado!');
              }}
            >
              <Copy size={18} />
              Copiar
            </button>
          )}

          {result && (
            <button
              onClick={handleSaveAndSchedule}
              disabled={saving}
              className={`bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 shadow-lg shadow-slate-200 flex items-center gap-2 ${saving ? 'opacity-70 cursor-wait' : ''}`}
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
              {addToCalendar ? 'Salvar e Agendar' : 'Salvar Post'}
            </button>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="text-gray-600" size={20} />
                Galeria do Estúdio Criativo
              </h3>
              <button onClick={() => setGalleryOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryImages.map((img: any) => (
                    <div
                      key={img.id}
                      onClick={() => handleSelectFromGallery(img.url)}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-slate-500 hover:shadow-lg transition-all relative group"
                    >
                      <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Nenhuma imagem encontrada na galeria.</p>
                  <p className="text-sm">Gere imagens no Estúdio Criativo primeiro.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
