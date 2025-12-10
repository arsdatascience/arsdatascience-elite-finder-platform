// aiController.js - Implementation using OpenAI and Gemini
// Provider: OpenAI (Custom Endpoint /v1/responses) and Gemini (Google Generative AI)

const { ClaudeService, ClaudeModel } = require('./services/anthropicService');
const qdrantService = require('./services/qdrantService');
const db = require('./database');
const { decrypt } = require('./utils/crypto');
const { getTenantScope } = require('./utils/tenantSecurity');

const getEffectiveApiKey = async (provider = 'openai', userId = null) => {
  // 1. Try to get from User DB (SaaS Multi-tenant)
  if (userId) {
    try {
      const result = await db.query('SELECT openai_key, gemini_key, anthropic_key FROM users WHERE id = $1', [userId]);
      if (result.rows.length > 0) {
        const keys = result.rows[0];
        let userKey = null;
        if (provider === 'gemini' && keys.gemini_key) userKey = decrypt(keys.gemini_key);
        else if (provider === 'anthropic' && keys.anthropic_key) userKey = decrypt(keys.anthropic_key);
        else if ((provider === 'openai' || !provider) && keys.openai_key) userKey = decrypt(keys.openai_key);

        if (userKey) {
          console.log(`🔑 Using User API Key for ${provider}`);
          return userKey;
        }
      }
    } catch (err) {
      console.error('Error fetching user API key:', err);
    }
  }

  // 2. Fallback to System Env Vars
  if (provider === 'gemini') {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const allKeys = Object.keys(process.env);
      const geminiKey = allKeys.find(k => k.includes('GEMINI') && k.includes('KEY'));
      if (geminiKey) apiKey = process.env[geminiKey];
    }
    return apiKey;
  } else if (provider === 'anthropic') {
    return process.env.ANTHROPIC_API_KEY;
  } else {
    let apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const allKeys = Object.keys(process.env);
      const openaiKey = allKeys.find(k => k.includes('OPENAI') && k.includes('KEY'));
      if (openaiKey) apiKey = process.env[openaiKey];
    }
    return apiKey;
  }
};

// Helper to generate embeddings
const generateEmbeddings = async (text, apiKey) => {
  const API_URL = "https://api.openai.com/v1/embeddings";

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small"
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI Embedding Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Embedding Generation Failed:", error);
    return null;
  }
};

const redis = require('./redisClient'); // Ensure redis is imported at top if not already

const generateDashboardInsights = async (req, res) => {
  const { kpis, selectedClient, platform, dateRange, provider = 'openai' } = req.body;
  const userId = req.user ? req.user.id : null;
  const { isSuperAdmin, tenantId } = getTenantScope(req);

  // Cache Key Strategy: Hash of the input parameters to ensure uniqueness
  // Simple key: insight:tenant:client:dateStart:dateEnd
  const cacheKey = `ai_insight:${tenantId}:${selectedClient || 'all'}:${dateRange?.start || 'all'}:${dateRange?.end || 'all'}`;

  try {
    // 1. Check Cache
    const cachedInsight = await redis.get(cacheKey);
    if (cachedInsight) {
      console.log('⚡ Serving AI Insight from Redis Cache');
      return res.json({ insight: cachedInsight });
    }

    // SAAS FIX: Try to get key from tenant owner if possible, or system fallback
    // For now, we use the logged user's key or system key. 
    // Ideally, we should check if the tenant has a specific key configured.
    const apiKey = await getEffectiveApiKey(provider, userId);

    if (!apiKey) {
      console.warn("⚠️ Dashboard Insight: No API Key found.");
      // Return a mock insight instead of error to prevent frontend spinner hang
      return res.json({ insight: "⚠️ API Key não configurada. Configure a OPENAI_API_KEY no arquivo .env para receber insights reais." });
    }

    // 1. Analyze KPIs to form a search query
    let queryText = "Estratégias gerais de marketing digital e otimização de campanhas";
    const roiKpi = kpis.find(k => k.label.includes('ROI') || k.label.includes('ROAS'));
    const ctrKpi = kpis.find(k => k.label.includes('CTR'));
    const cpcKpi = kpis.find(k => k.label.includes('CPC'));

    if (roiKpi && roiKpi.trend === 'down') queryText = "Como recuperar ROI e ROAS em queda em campanhas de tráfego pago";
    else if (ctrKpi && ctrKpi.trend === 'down') queryText = "Como aumentar CTR e melhorar criativos saturados";
    else if (cpcKpi && cpcKpi.trend === 'up') queryText = "Estratégias para reduzir CPC alto e melhorar índice de qualidade";

    console.log(`🔍 Searching knowledge base for: "${queryText}"`);

    // 2. Generate Embedding for the query
    const queryVector = await generateEmbeddings(queryText, apiKey);

    // 3. Search in Qdrant (Fail-safe)
    let context = "";
    if (queryVector) {
      try {
        const searchResult = await qdrantService.searchVectors('marketing_strategies', queryVector, 3);
        if (searchResult.success && searchResult.results.length > 0) {
          context = searchResult.results.map(r => r.payload.content || r.payload.text).join("\n\n");
          console.log("📚 Knowledge Base Context Found:", searchResult.results.length, "items");
        }
      } catch (err) {
        console.warn("⚠️ Qdrant search failed (ignoring):", err.message);
      }
    }

    // 4. Generate Insight with LLM
    const prompt = `
      Atue como um Especialista Sênior em Data Analytics e Marketing Digital.
      
      CONTEXTO DO CLIENTE:
      - Cliente ID: ${selectedClient}
      - Plataforma: ${platform}
      - Período: ${dateRange.start} a ${dateRange.end}
      
      DADOS ATUAIS (KPIs):
      ${JSON.stringify(kpis)}

      BASE DE CONHECIMENTO RECUPERADA (RAG):
      ${context || "Nenhum contexto específico encontrado na base vetorial. Use seu conhecimento geral avançado."}

      TAREFA:
      Gere um insight técnico, direto e acionável sobre a situação atual.
      - Se houver problemas (quedas), explique a causa provável e a solução.
      - Se estiver estável/crescendo, sugira o próximo passo de escala.
      - Use terminologia técnica correta (CPA, ROAS, LTV, Churn, etc).
      - Máximo de 2 frases.
      - Seja específico, evite generalidades como "melhore seus anúncios". Diga "Teste novos hooks nos primeiros 3s do vídeo".

      RESPOSTA (Apenas o texto do insight):
    `;

    const insight = await callOpenAI(prompt, apiKey, "gpt-4-turbo-preview", false);
    const finalInsight = insight.trim();

    // 5. Save to Cache (1 Hour - Insights don't change that fast)
    await redis.set(cacheKey, finalInsight, 'EX', 3600);

    res.json({ insight: finalInsight });

  } catch (error) {
    console.error("Dashboard Insight Generation Failed:", error);
    res.status(500).json({ error: "Failed to generate insight" });
  }
};




const formatChatHistory = (messages) => {
  return messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
};

// Helper function to call OpenAI API via standard /v1/chat/completions endpoint
const callOpenAI = async (prompt, apiKey, model = "gpt-4o", jsonMode = false) => {
  const API_URL = "https://api.openai.com/v1/chat/completions";

  // Fallback para gpt-4o se o modelo solicitado for gpt-5 (que não existe publicamente)
  const safeModel = model.includes('gpt-5') ? 'gpt-4o' : model;

  const requestBody = {
    model: safeModel,
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  };

  if (jsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errorData}`);
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Unknown response structure:", JSON.stringify(data, null, 2));
      throw new Error("Empty or unknown response structure from OpenAI API");
    }

    return content;

  } catch (error) {
    console.error("OpenAI API Call Failed:", error);
    throw error;
  }
};

// Helper function to call Gemini API
const callGemini = async (prompt, apiKey, model = "gemini-2.0-flash", jsonMode = false) => {
  // Map internal model names to API model names if necessary, or use direct
  // Assuming model passed is like 'gemini-2.0-flash'
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let finalPrompt = prompt;
  if (jsonMode) {
    finalPrompt += "\n\nIMPORTANT: Return ONLY valid JSON.";
  }

  const requestBody = {
    contents: [{
      parts: [{
        text: finalPrompt
      }]
    }]
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorData}`);
    }

    const data = await response.json();

    let content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("Unknown response structure:", JSON.stringify(data, null, 2));
      throw new Error("Empty or unknown response structure from Gemini API");
    }

    return content;

  } catch (error) {
    console.error("Gemini API Call Failed:", error);
    throw error;
  }
};

// Helper function to call Anthropic API
const callAnthropic = async (prompt, apiKey, model, jsonMode = false) => {
  try {
    // Se o modelo não for passado ou for inválido, o ClaudeService usa o default (Sonnet 4.5)
    const claude = new ClaudeService(apiKey, model);

    let finalPrompt = prompt;
    if (jsonMode) {
      finalPrompt += "\n\nIMPORTANT: Return ONLY valid JSON.";
    }

    const response = await claude.message(finalPrompt, {
      maxTokens: 4096,
      temperature: 0.7
    });

    return response;
  } catch (error) {
    console.error("Anthropic API Call Failed:", error);
    throw error;
  }
};

const analyzeChatConversation = async (req, res) => {
  const { messages, provider = 'openai', model } = req.body;
  const userId = req.user ? req.user.id : null; // Get from auth middleware
  const apiKey = await getEffectiveApiKey(provider, userId);

  if (!apiKey) return res.status(500).json({ error: `${provider.toUpperCase()} API Key not configured` });

  // Validate messages input
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    console.error("❌ Invalid messages format received:", messages);
    return res.status(400).json({ error: "Invalid messages format. Expected non-empty array." });
  }

  const chatText = formatChatHistory(messages);

  const prompt = `
    Você é uma IA especialista em Vendas B2B e Psicologia do Consumidor, atuando como gerente de qualidade da plataforma 'EliteConversion'.
    
    Sua missão é realizar uma META ANÁLISE da conversa de vendas abaixo e fornecer insights estratégicos em PORTUGUÊS DO BRASIL.
    Analise profundamente:
    1. Sentimento e Intenção do cliente.
    2. Estratégias de Conversão utilizadas (ou perdidas).
    3. Uso de Gatilhos Mentais (Escassez, Urgência, Autoridade, etc).

    Histórico da Conversa:
    ${chatText}
    
    Retorne um objeto JSON estrito com a seguinte estrutura:
    {
      "sentiment": "positive" | "neutral" | "negative",
      "intent": "high" | "medium" | "low",
      "summary": "Resumo executivo da situação (max 2 frases).",
      "positivePoints": ["Ponto 1", "Ponto 2", "Ponto 3"],
      "suggestions": ["Sugestão 1", "Sugestão 2", "Sugestão 3"],
      "warnings": ["Aviso 1", "Aviso 2", "Aviso 3"]
    }
  `;

  try {
    console.log(`🔍 Starting Chat Analysis using ${provider} (${model || 'default'})...`);

    let text;
    if (provider === 'gemini') {
      text = await callGemini(prompt, apiKey, model, false);
    } else if (provider === 'anthropic') {
      text = await callAnthropic(prompt, apiKey, model, false);
    } else {
      text = await callOpenAI(prompt, apiKey, model, false);
    }

    console.log("📩 Raw AI Response for Analysis:", text);

    // Robust JSON extraction
    if (typeof text !== 'string') {
      text = JSON.stringify(text);
    }
    let cleanText = text.trim();

    // Try to find JSON block if wrapped in markdown
    const jsonMatch = cleanText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
      cleanText = jsonMatch[1].trim();
    } else {
      // If no markdown, try to find the first '{' and last '}'
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
    }

    console.log("🧹 Cleaned JSON Text:", cleanText);

    const jsonResponse = JSON.parse(cleanText);
    console.log("✅ Analysis Parsed Successfully");
    res.json(jsonResponse);

  } catch (error) {
    console.error("❌ Analysis Failed:", error);
    // Fallback: return a valid structure even on error to avoid frontend crash
    res.status(200).json({
      sentiment: "neutral",
      intent: "unknown",
      summary: "Não foi possível analisar a conversa devido a um erro técnico.",
      positivePoints: [],
      suggestions: ["Tente novamente mais tarde."],
      warnings: ["Erro na análise IA"]
    });
  }
};

const generateMarketingContent = async (req, res) => {
  const request = req.body;
  const provider = request.provider || 'openai';
  const model = request.model;
  const userId = req.user ? req.user.id : null;
  const apiKey = await getEffectiveApiKey(provider, userId);

  if (!apiKey) return res.status(500).json({ error: `${provider.toUpperCase()} API Key not configured` });

  let typeDescription = "";
  switch (request.type) {
    case 'ad': typeDescription = "Anúncio Pago (Ads) focado em conversão direta."; break;
    case 'post': typeDescription = "Post Orgânico para Feed com foco em engajamento."; break;
    case 'reels': typeDescription = "Roteiro para Vídeo Curto (Reels/TikTok) com hooks visuais."; break;
    case 'stories': typeDescription = "Sequência de 3 Stories com narrativa envolvente."; break;
    case 'carousel': typeDescription = "Estrutura de Carrossel (Slide a Slide) educativo."; break;
    case 'poll': typeDescription = "Pergunta para Enquete com opções interativas."; break;
    case 'article': typeDescription = "Artigo de Blog otimizado para SEO."; break;
    default: typeDescription = "Post de Marketing Digital.";
  }

  const prompt = `
      Você é um Copywriter de Elite de classe mundial (nível Ogilvy/Gary Halbert).
      
      TAREFA: Criar conteúdo de marketing de alta conversão.
      FORMATO: ${typeDescription}
      PLATAFORMA: ${request.platform}
      TÓPICO/PRODUTO: ${request.topic}
      TOM DE VOZ: ${request.tone}
      IDIOMA: Português do Brasil (PT-BR)
      CLIENTE_ID: ${request.clientId || 'N/A'}

      REGRAS:
      1. Use gatilhos mentais (urgência, escassez, prova social).
      2. Se for Reels, forneça um roteiro visual passo a passo.
      3. Se for Carrossel, separe por Slides.
      4. Se for Blog, use H2 e H3.
      5. Gere 3 opções de Headlines (Títulos).
      6. Sugira uma ideia visual clara para a imagem/vídeo.

      Retorne JSON estrito com a seguinte estrutura:
      {
        "headlines": ["Titulo 1", "Titulo 2", "Titulo 3"],
        "body": "Texto do conteúdo...",
        "cta": "Chamada para ação...",
        "hashtags": ["#tag1", "#tag2"],
        "imageIdea": "Descrição da imagem/vídeo..."
      }
  `;

  try {
    let text;
    if (provider === 'gemini') {
      text = await callGemini(prompt, apiKey, model, true);
    } else if (provider === 'anthropic') {
      text = await callAnthropic(prompt, apiKey, model, true);
    } else {
      text = await callOpenAI(prompt, apiKey, model, true);
    }

    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    res.json(JSON.parse(cleanText));
  } catch (error) {
    console.error("Content Generation Failed:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
};

const churnController = require('./churnController');

// ... (existing code)

const askEliteAssistant = async (req, res) => {
  const { history, question, provider = 'openai', model, clientId } = req.body;
  const userId = req.user ? req.user.id : null;
  const apiKey = await getEffectiveApiKey(provider, userId);

  if (!apiKey) {
    return res.json({ answer: "⚠️ **Configuração Necessária:** A chave da API (OpenAI/Gemini/Anthropic) não foi encontrada no sistema backend. Por favor, verifique o arquivo `.env`." });
  }

  // Validate history parameter
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "Invalid history parameter" });
  }

  // Fetch Churn Risk Context if Client ID is provided
  let churnContext = "";
  if (clientId) {
    try {
      const riskData = await churnController.calculateRiskForClient(clientId);
      if (riskData) {
        churnContext = `
        🚨 **ALERTA DE RISCO DE CHURN DETECTADO** 🚨
        - Nível de Risco: ${riskData.riskLevel} (Score: ${riskData.riskScore}/100)
        - Fatores de Risco: ${riskData.factors.join(', ')}
        
        ⚠️ **INSTRUÇÃO CRÍTICA DE RETENÇÃO:**
        Este cliente está em risco de cancelamento. Sua prioridade MÁXIMA é ser empático, resolver problemas imediatamente e evitar atritos.
        Se o risco for CRITICAL ou HIGH, ofereça atendimento prioritário ou descontos se tiver autonomia (simule que tem).
        `;
      }
    } catch (err) {
      console.warn("Failed to fetch churn risk for context:", err);
    }
  }

  // --- SYMBIOSIS: FINANCIAL ADVISOR ---
  // Buscar snapshot financeiro do mês atual para dar contexto ao Agente
  let financialContext = "";
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    // SAAS FIX: Use tenant_id from user object instead of user_id
    // Assuming req.user has tenant_id (injected by auth middleware)
    const { isSuperAdmin, tenantId } = getTenantScope(req);

    if (tenantId && !isSuperAdmin) {
      // Financial data is in OPS DB (Maglev)
      const finRes = await db.opsPool.query(`
            SELECT 
                SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as total_expense
            FROM financial_transactions
            WHERE tenant_id = $1 AND date >= $2 AND date <= $3
        `, [tenantId, startOfMonth, endOfMonth]);

      if (finRes.rows.length > 0) {
        const f = finRes.rows[0];
        const balance = f.total_income - f.total_expense;
        financialContext = `
            💰 **CONTEXTO FINANCEIRO (Mês Atual):**
            - Receita Confirmada: R$ ${parseFloat(f.total_income).toFixed(2)}
            - Despesas Pagas: R$ ${parseFloat(f.total_expense).toFixed(2)}
            - Saldo do Mês: R$ ${balance.toFixed(2)}
            
            Se o usuário perguntar sobre finanças, use estes dados exatos.
            `;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch financial context:", err);
  }

  const conversationContext = history.map(msg =>
    `${msg.sender === 'client' ? 'Usuário' : 'Assistente'}: ${msg.text}`
  ).join('\n');

  // --- RAG: KNOWLEDGE BASE SEARCH ---
  let ragContext = "";
  try {
    const queryVector = await generateEmbeddings(question, apiKey);
    if (queryVector) {
      const searchResult = await qdrantService.searchVectors('marketing_strategies', queryVector, 3);
      if (searchResult.success && searchResult.results.length > 0) {
        const docs = searchResult.results.map(r => r.payload.content || r.payload.text).join("\n\n");
        ragContext = `
        📚 **BASE DE CONHECIMENTO (RAG):**
        Use estas informações internas para enriquecer sua resposta:
        ${docs}
        `;
        console.log("📚 RAG Context injected into Chat Assistant");
      }
    }
  } catch (ragErr) {
    console.warn("RAG Search failed:", ragErr.message);
  }

  // --- INTERNET ACCESS CONTROL ---
  let internetContext = "";
  if (req.body.internetAccess) {
    internetContext = `
      🌍 **ACESSO À INTERNET: ATIVO**
      Você tem permissão para usar seu amplo conhecimento de treinamento para responder sobre tendências de mercado, notícias gerais e fatos externos.
      Combine isso com os dados internos para uma resposta completa.
      `;
  } else {
    internetContext = `
      🔒 **ACESSO À INTERNET: DESATIVADO (MODO RESTRITO)**
      Responda APENAS com base nos dados fornecidos no Contexto Interno (Financeiro, Risco de Churn, Base de Conhecimento RAG).
      Se a resposta não estiver nos dados, diga "Não tenho informações internas suficientes para responder a isso".
      NÃO invente fatos externos.
      `;
  }

  const prompt = `
    Você é o **Elite Strategist**, um Especialista Sênior em Marketing Digital e Vendas da plataforma 'EliteFinder'.
    
    ${churnContext}
    ${financialContext}
    ${ragContext}
    ${internetContext}

    🧠 **SUAS ESPECIALIDADES:**
    1. **Tráfego Pago:** Estratégias avançadas para Google Ads, Meta Ads (Facebook/Instagram), LinkedIn Ads e TikTok Ads.
    2. **Social Media:** Criação de calendários editoriais, roteiros para Reels/TikTok, e estratégias de engajamento.
    3. **Copywriting:** Escrita persuasiva para anúncios, landing pages e e-mails (AIDA, PAS, etc).
    4. **Funis de Vendas:** Otimização de conversão (CRO) e jornadas do cliente.

    🎯 **DIRETRIZES DE RESPOSTA:**
    - Atue como um consultor experiente: seja estratégico, direto e prático.
    - Quando o usuário pedir ideias, forneça listas estruturadas (ex: "3 Ideias de Hooks para Reels").
    - Se perguntarem sobre métricas, explique o que significam (CTR, ROAS, CPA) e qual o benchmark ideal.
    - Responda sempre em **Português do Brasil** com tom profissional mas acessível.

    Contexto da Conversa Atual:
    ${conversationContext}

    Nova Pergunta do Usuário:
    ${question}
  `;

  try {
    let text;
    if (provider === 'gemini') {
      text = await callGemini(prompt, apiKey, model, false);
    } else if (provider === 'anthropic') {
      text = await callAnthropic(prompt, apiKey, model, false);
    } else {
      text = await callOpenAI(prompt, apiKey, model, false);
    }
    res.json({ answer: text });
  } catch (error) {
    console.error("Chat Assistant Failed:", error);
    res.status(500).json({ error: "Failed to get answer from AI" });
  }
};

/**
 * Internal function to analyze conversation strategy
 */
const analyzeStrategyInternal = async (messages, agentContext, apiKey) => {
  const prompt = `
        Atue como um Diretor de Estratégia Comercial e Marketing Sênior. Analise a seguinte conversa entre um Agente (Bot) e um Cliente (Prospect).
        
        CONTEXTO DO AGENTE:
        ${JSON.stringify(agentContext || {})}

        HISTÓRICO DA CONVERSA:
        ${messages.map(m => `${m.role === 'user' ? 'CLIENTE' : 'AGENTE'}: ${m.content}`).join('\n')}

        TAREFA:
        Realize uma análise em tempo real para fornecer "Coaching de Vendas" imediato.
        Identifique o sentimento, objeções ocultas e sugira a próxima melhor ação.

        Gere um relatório estratégico estruturado em JSON com os seguintes campos:
        1. "sentiment": Sentimento atual do cliente (Positivo, Neutro, Cético, Irritado).
        2. "detected_objections": Lista de objeções identificadas (ex: Preço, Concorrência, Autoridade).
        3. "buying_stage": Estágio de compra (Curiosidade, Consideração, Decisão).
        4. "suggested_strategy": Uma estratégia tática para o vendedor usar AGORA (ex: "Use a técnica de Espelhamento e foque na dor X").
        5. "next_best_action": A próxima pergunta ou afirmação exata que deve ser feita para avançar a venda.
        6. "coach_whisper": Uma dica curta e direta para o vendedor (ex: "Cuidado, ele está comparando com o concorrente Y, destaque nosso suporte").

        Responda APENAS o JSON.
        `;

  const text = await callOpenAI(prompt, apiKey, "gpt-4-turbo-preview", true);
  const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanText);
};

/**
 * Analisa uma conversa e gera insights estratégicos de Vendas e Marketing
 */
const analyzeConversationStrategy = async (req, res) => {
  const { messages, agentContext } = req.body;
  const provider = 'openai';
  const userId = req.user ? req.user.id : null;
  const apiKey = await getEffectiveApiKey(provider, userId);

  try {
    const analysis = await analyzeStrategyInternal(messages, agentContext, apiKey);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing strategy:', error);
    res.status(500).json({ error: 'Failed to analyze conversation' });
  }
};

/**
 * Gera uma configuração completa de agente baseada em uma descrição simples
 */
const generateAgentConfig = async (req, res) => {
  const { description, provider = 'openai' } = req.body;
  const userId = req.user ? req.user.id : null;
  const apiKey = await getEffectiveApiKey(provider, userId);

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  // --- RAG: KNOWLEDGE BASE SEARCH FOR AGENT CONTEXT ---
  let knowledgeContext = "";
  try {
    const queryVector = await generateEmbeddings(description, apiKey);
    if (queryVector) {
      const searchResult = await qdrantService.searchVectors('marketing_strategies', queryVector, 3);
      if (searchResult.success && searchResult.results.length > 0) {
        const docs = searchResult.results.map(r => r.payload.content || r.payload.text).join("\n\n");
        knowledgeContext = `
        📚 **CONHECIMENTO INTERNO RELEVANTE ENCONTRADO:**
        O usuário possui os seguintes documentos na base de conhecimento que parecem relevantes para este agente.
        Tente incorporar as regras ou informações chave destes textos no "system prompt" do agente gerado:
        ${docs.substring(0, 2000)}... (truncado)
        `;
        console.log("📚 RAG Context injected into Agent Builder");
      }
    }
  } catch (ragErr) {
    console.warn("Agent Builder RAG Search failed:", ragErr.message);
  }

  const prompt = `
    Você é um Arquiteto de Agentes de IA Especialista.
    Sua tarefa é criar uma configuração técnica completa para um Agente de IA com base na seguinte descrição do usuário:
    
    DESCRIÇÃO DO USUÁRIO: "${description}"

    ${knowledgeContext}

    Gere um JSON estrito com a seguinte estrutura exata, preenchendo os campos de forma criativa e profissional:

    {
      "identity": {
        "name": "Nome criativo do agente",
        "category": "sales",
        "description": "Descrição curta da função do agente",
        "class": "SalesAgent",
        "specializationLevel": 5,
        "status": "active"
      },
      "aiConfig": {
        "provider": "openai",
        "model": "gpt-4-turbo-preview",
        "temperature": 0.7,
        "topP": 0.9,
        "maxTokens": 1000,
        "responseMode": "balanced"
      },
      "prompts": {
        "system": "Um prompt de sistema detalhado e robusto (min 3 parágrafos) que defina a persona, regras de negócio, o que fazer e o que NÃO fazer. Use markdown.",
        "responseStructure": "Instruções sobre como estruturar a resposta (ex: usar tópicos, ser conciso).",
        "analysis": "Instruções para análise de input do usuário."
      }
    }

    Responda APENAS o JSON. Sem blocos de código markdown.
    `;

  try {
    // Usar callOpenAI com jsonMode=true para garantir JSON válido
    const text = await callOpenAI(prompt, apiKey, "gpt-4-turbo-preview", true);

    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const config = JSON.parse(cleanText);

    res.json(config);

  } catch (error) {
    console.error('Error generating agent config:', error);
    res.status(500).json({ error: 'Failed to generate configuration' });
  }
};

const saveAnalysis = async (req, res) => {
  const { messages, analysis, provider, model } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO chat_analyses (messages, analysis, provider, model) VALUES ($1, $2, $3, $4) RETURNING *',
      [JSON.stringify(messages), JSON.stringify(analysis), provider, model]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
};

const generateContentIdeasFromChat = async (req, res) => {
  const { provider = 'openai', limit = 50 } = req.body;
  const userId = req.user ? req.user.id : null;
  const { isSuperAdmin, tenantId } = getTenantScope(req);
  const apiKey = await getEffectiveApiKey(provider, userId);

  if (!apiKey) return res.status(500).json({ error: "API Key not configured" });

  try {
    // SAAS FIX: Filter messages by Tenant ID to prevent data leak
    // Join chat_messages -> leads -> clients -> tenant_id
    let query = `
      SELECT cm.content 
      FROM chat_messages cm
      JOIN leads l ON cm.lead_id = l.id
      JOIN clients c ON l.client_id = c.id
      WHERE cm.role = 'user' 
    `;
    let params = [limit];

    if (!isSuperAdmin && tenantId) {
      query += ` AND c.tenant_id = $2`;
      params.push(tenantId);
    }

    query += ` ORDER BY cm.created_at DESC LIMIT $1`;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.json({ ideas: [] });
    }

    const messagesText = result.rows.map(r => r.content).join("\n");

    // 2. Analyze and Generate Ideas
    const prompt = `
      Atue como um Estrategista de Conteúdo.
      Analise as seguintes mensagens recentes de clientes/leads:
      
      "${messagesText}"

      TAREFA:
      1. Identifique as 3 principais dores, dúvidas ou desejos recorrentes.
      2. Para cada uma, gere uma ideia de Post para Instagram/LinkedIn que resolva essa dúvida.

      Retorne um JSON estrito:
      {
        "analysis": "Resumo das tendências identificadas...",
        "ideas": [
          {
            "title": "Título do Post",
            "format": "Reels/Carrossel/Static",
            "hook": "A frase inicial para prender a atenção",
            "description": "Breve descrição do conteúdo"
          }
        ]
      }
    `;

    const text = await callOpenAI(prompt, apiKey, "gpt-4-turbo-preview", true);
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();

    res.json(JSON.parse(cleanText));

  } catch (error) {
    console.error("Content Ideas Generation Failed:", error);
    res.status(500).json({ error: "Failed to generate ideas" });
  }
};

const startBatchGeneration = async (req, res) => {
  const { days, topics, platform, tone, targetAudience, provider = 'openai', clientId } = req.body;
  const user_id = req.user ? req.user.id : null;
  const { tenantId } = getTenantScope(req);
  const { jobsQueue } = require('./queueClient'); // Ensure this imports correctly

  try {
    // 1. Create Batch Record
    const batchResult = await db.query(
      `INSERT INTO content_batches (user_id, topic, total_days, platform, tone, settings, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'processing') 
       RETURNING id`,
      [user_id, JSON.stringify(topics), days, platform, tone, JSON.stringify(targetAudience)]
    );
    const batchId = batchResult.rows[0].id;

    console.log(`🚀 Starting Batch Generation ${batchId} for ${days} days`);

    // 2. Add Job to Queue (One job per day/topic to parallelize)
    const jobs = topics.map((dailyTopic, index) => ({
      name: 'generate_batch_content',
      data: {
        type: 'generate_batch_content',
        payload: {
          batchId,
          dayIndex: index + 1,
          topic: dailyTopic,
          platform,
          tone,
          targetAudience,
          provider,
          userId: user_id,
          tenantId,
          clientId
        }
      }
    },
      opts: {
      jobId: `batch_${batchId}_day_${index + 1}`
    }
    }));

  // Add all jobs to queue
  // Check if jobsQueue exists and has addBulk
  if (jobsQueue && jobsQueue.addBulk) {
    await jobsQueue.addBulk(jobs);
  } else {
    console.warn("⚠️ jobsQueue not available, falling back to sequential add or error.");
    // Fallback if needed, but assuming it works for now based on project structure
  }

  res.json({
    success: true,
    batchId,
    message: `Batch iniciada! ${days} posts sendo gerados em segundo plano.`
  });

} catch (error) {
  console.error('Batch Generation Start Failed:', error);
  res.status(500).json({ error: 'Failed to start batch generation' });
}
};

module.exports = {
  analyzeChatConversation,
  generateMarketingContent,
  askEliteAssistant,
  analyzeConversationStrategy,
  generateAgentConfig,
  saveAnalysis,
  generateDashboardInsights,
  analyzeStrategyInternal,
  getEffectiveApiKey,
  generateContentIdeasFromChat,
  startBatchGeneration
};
