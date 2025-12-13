$path = "c:\Users\DenisMay\elite-finder-appv1\frontend\src\components\AgentBuilder.tsx"
$content = Get-Content $path -Raw

# 1. Add Script Field
$validationBlockEnd = @"
                                                    <ul className="text-xs text-orange-700 space-y-1">
                                                        <li>• Verificar consistência</li>
                                                        <li>• Validar informações</li>
                                                        <li>• Checar alucinações</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
"@

$scriptField = @"
                                                    <ul className="text-xs text-orange-700 space-y-1">
                                                        <li>• Verificar consistência</li>
                                                        <li>• Validar informações</li>
                                                        <li>• Checar alucinações</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Novo Campo: Script / Roteiro */}
                                        <div className="mt-6 border-t pt-6">
                                            <label className="block text-sm font-bold text-gray-800 mb-1">Script / Roteiro de Conversa</label>
                                            <p className="text-xs text-gray-500 mb-2">Defina um roteiro passo-a-passo ou script de vendas que o agente deve seguir.</p>
                                            <textarea
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm bg-yellow-50"
                                                rows={6}
                                                placeholder="Ex: 1. Saudação e qualificação... 2. Apresentação do produto... 3. Tratamento de objeções..."
                                                value={config.prompts.scriptContent || ''}
                                                onChange={(e) => setConfig({ ...config, prompts: { ...config.prompts, scriptContent: e.target.value } })}
                                            />
                                        </div>
"@

$content = $content.Replace($validationBlockEnd, $scriptField)

# 2. Add KPIs Section
$qualitySafetyEnd = @"
                                            <p className="text-xs text-gray-500 mt-1">Valor atual: {config.advancedConfig?.qualitySafety.semanticCache.similarityThreshold}</p>
                                        </div>
                                    </div>
                                </div>
"@

$kpisSection = @"
                                            <p className="text-xs text-gray-500 mt-1">Valor atual: {config.advancedConfig?.qualitySafety.semanticCache.similarityThreshold}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* KPIs e Metas */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Zap className="text-yellow-500" /> KPIs e Metas do Agente
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">Defina os objetivos que o agente deve perseguir (ex: agendar reunião, capturar email).</p>
                                    
                                    <div className="space-y-3">
                                        {config.advancedConfig?.kpis?.map((kpi, index) => (
                                            <div key={index} className="flex gap-2 items-start">
                                                <input
                                                    type="text"
                                                    placeholder="Nome do KPI (ex: Taxa de Conversão)"
                                                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                                    value={kpi.name}
                                                    onChange={(e) => {
                                                        const newKpis = [...(config.advancedConfig?.kpis || [])];
                                                        newKpis[index] = { ...newKpis[index], name: e.target.value };
                                                        setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), kpis: newKpis } });
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Meta (ex: 10%)"
                                                    className="w-24 px-3 py-2 border rounded-lg text-sm"
                                                    value={kpi.target}
                                                    onChange={(e) => {
                                                        const newKpis = [...(config.advancedConfig?.kpis || [])];
                                                        newKpis[index] = { ...newKpis[index], target: e.target.value };
                                                        setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), kpis: newKpis } });
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newKpis = config.advancedConfig?.kpis?.filter((_, i) => i !== index);
                                                        setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), kpis: newKpis || [] } });
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => {
                                                const newKpis = [...(config.advancedConfig?.kpis || []), { name: '', target: '' }];
                                                setConfig({ ...config, advancedConfig: { ...(config.advancedConfig || INITIAL_CONFIG.advancedConfig!), kpis: newKpis } });
                                            }}
                                            className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
                                        >
                                            + Adicionar KPI
                                        </button>
                                    </div>
                                </div>
"@

$content = $content.Replace($qualitySafetyEnd, $kpisSection)

# 3. Add Deploy Tab
# We target the closing of the main content area and the start of the Save Template Modal
$targetDeploy = @"
                    </div>
                </div>
            </div>
            {/* Modal Salvar Template */}
"@

# Note: escaping backticks in PowerShell string for JS template literals
$deployTab = @"
                        {/* TAB: DEPLOY */}
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
                                                    navigator.clipboard.writeText(`<script src="` + "${window.location.origin}" + `/widget.js" data-agent-id="SEU_AGENT_ID"></script>`);
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
    agentId: 'SEU_AGENT_ID_AQUI',
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
"@

$content = $content.Replace($targetDeploy, $deployTab)

Set-Content -Path $path -Value $content
