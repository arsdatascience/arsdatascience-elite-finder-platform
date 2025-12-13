$path = "c:\Users\DenisMay\elite-finder-appv1\frontend\src\components\AgentBuilder.tsx"
$lines = Get-Content $path
$truncated = $lines[0..1677]

$newContent = @"
                        {activeTab === 'deploy' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <LayoutTemplate className="text-blue-600" /> Widget & Deploy
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Incorpore seu agente em qualquer site usando o código abaixo.
                                    </p>
                                    
                                    <div className="bg-gray-900 rounded-lg p-4 relative group">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    const code = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['AgentWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','mw','` + "${window.location.origin}" + `/widget.js'));
  
  mw('init', { 
    agentId: '` + "${config.id || 'SEU_AGENT_ID_AQUI'}" + `',
    primaryColor: '#2563EB'
  });
</script>`;
                                                    navigator.clipboard.writeText(code);
                                                    alert('Código copiado!');
                                                }}
                                                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur-sm"
                                            >
                                                Copiar Código
                                            </button>
                                        </div>
                                        <code className="text-green-400 font-mono text-sm block whitespace-pre-wrap">
{`<script>
  (function(w,d,s,o,f,js,fjs){
    w['AgentWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','mw','` + "${window.location.origin}" + `/widget.js'));
  
  mw('init', { 
    agentId: '` + "${config.id || 'SEU_AGENT_ID_AQUI'}" + `',
    primaryColor: '#2563EB'
  });
</script>`}
                                        </code>
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <h4 className="font-bold text-blue-800 mb-2">1. Copie o Código</h4>
                                            <p className="text-sm text-blue-600">Copie o snippet acima e substitua 'SEU_AGENT_ID_AQUI' pelo ID do seu agente após salvar.</p>
                                        </div>
                                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                            <h4 className="font-bold text-purple-800 mb-2">2. Cole no Site</h4>
                                            <p className="text-sm text-purple-600">Cole o código antes da tag &lt;/body&gt; em todas as páginas onde deseja que o chat apareça.</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                            <h4 className="font-bold text-green-800 mb-2">3. Personalize</h4>
                                            <p className="text-sm text-green-600">Você pode passar parâmetros adicionais como 'primaryColor' para ajustar a aparência.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Salvar Template */}
            {showSaveTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Save className="text-purple-600" /> Salvar como Template
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Template</label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="Ex: Bot Imobiliária Premium"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    placeholder="Descreva o propósito deste template..."
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowSaveTemplateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                                >
                                    Salvar Template
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Configuração Mágica */}
            {showMagicModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Wand2 className="text-indigo-600" /> Configuração Mágica de IA
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Descreva o agente que você deseja criar e nossa IA irá gerar a configuração perfeita (identidade, prompts e parâmetros) para você.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Agente</label>
                                <textarea
                                    value={magicDescription}
                                    onChange={(e) => setMagicDescription(e.target.value)}
                                    placeholder="Ex: Um especialista em vendas de imóveis de luxo que seja persuasivo, educado e focado em agendar visitas. Ele deve saber lidar com objeções de preço."
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowMagicModal(false)}
                                    disabled={isGeneratingConfig}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleMagicConfig}
                                    disabled={isGeneratingConfig || !magicDescription}
                                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 ${isGeneratingConfig ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isGeneratingConfig ? (
                                        <><Loader2 className="animate-spin" size={18} /> Gerando Mágica...</>
                                    ) : (
                                        <><Wand2 size={18} /> Gerar Configuração</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Carregar Template */}
            {showLoadTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-2xl animate-fade-in max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <LayoutTemplate className="text-blue-600" /> Carregar Template
                            </h3>
                            <button onClick={() => setShowLoadTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        {!loadingTemplates && availableTemplates.length > 0 && (
                            <div className="mb-4 flex justify-end">
                                <button
                                    onClick={handleSetupTemplates}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                    title="Recarregar templates do sistema"
                                >
                                    <RefreshCw size={12} /> Atualizar Lista
                                </button>
                            </div>
                        )}
                        {loadingTemplates ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableTemplates.map(template => (
                                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group" onClick={() => handleSelectTemplate(template.template_id)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-800 group-hover:text-blue-700">{template.template_name}</h4>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{template.category}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2">{template.template_description || 'Sem descrição.'}</p>
                                    </div>
                                ))}
                                {availableTemplates.length === 0 && (
                                    <div className="col-span-full text-center py-8 text-gray-400 flex flex-col items-center gap-4">
                                        <p>Nenhum template encontrado.</p>
                                        {showSetupButton && (
                                            <button
                                                onClick={handleSetupTemplates}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                            >
                                                <Database size={18} /> Inicializar Templates Padrão
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};
"@

$finalContent = $truncated + $newContent
Set-Content -Path $path -Value $finalContent
