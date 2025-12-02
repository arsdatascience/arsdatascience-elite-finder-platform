// aiController.js - Implementation using OpenAI and Gemini
// Provider: OpenAI (Custom Endpoint /v1/responses) and Gemini (Google Generative AI)

const { ClaudeService, ClaudeModel } = require('./services/anthropicService');
const qdrantService = require('./services/qdrantService');
const db = require('./database');
const { decrypt } = require('./utils/crypto');

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

const generateDashboardInsights = async (req, res) => {
  const { kpis, selectedClient, platform, dateRange, provider = 'openai' } = req.body;
  const userId = req.user ? req.user.id : null;
  const apiKey = await getEffectiveApiKey(provider, userId);

  if (!apiKey) return res.status(500).json({ error: "API Key not configured" });

  try {
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

    res.json({ insight: insight.trim() });

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

const askEliteAssistant = async (req, res) => {
  const { history, question, provider = 'openai', model } = req.body;
  const userId = req.user ? req.user.id : null;
  const apiKey = await getEffectiveApiKey(provider, userId);

  if (!apiKey) return res.status(500).json({ error: `${provider.toUpperCase()} API Key not configured` });

  // Validate history parameter
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "Invalid history parameter" });
  }

  const conversationContext = history.map(msg =>
    `${msg.sender === 'client' ? 'Usuário' : 'Assistente'}: ${msg.text}`
  ).join('\n');

  const prompt = `
    Você é o **Elite Strategist**, um Especialista Sênior em Marketing Digital e Vendas da plataforma 'EliteFinder'.
    
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
 * Analisa uma conversa e gera insights estratégicos de Vendas e Marketing
 */
const analyzeConversationStrategy = async (req, res) => {
  const { messages, agentContext } = req.body;
  const provider = 'openai'; // Default provider for this specific task
  const userId = req.user ? req.user.id : null;
  const apiKey = await getEffectiveApiKey(provider, userId);

  try {
    const prompt = `
        Atue como um Diretor de Estratégia Comercial e Marketing Sênior. Analise a seguinte conversa entre um Agente (Bot) e um Cliente.
        
        CONTEXTO DO AGENTE:
        ${JSON.stringify(agentContext || {})}

        HISTÓRICO DA CONVERSA:
        ${messages.map(m => `${m.role === 'user' ? 'CLIENTE' : 'AGENTE'}: ${m.content}`).join('\n')}

        Gere um relatório estratégico estruturado em JSON com os seguintes campos:
        1. "sentiment_analysis": Análise do sentimento do cliente (0-10) e breve explicação.
        2. "sales_opportunity": Probabilidade de venda (Baixa/Média/Alta) e justificativa.
        3. "missed_opportunities": Oportunidades que o agente deixou passar.
        4. "marketing_angles": 3 ângulos de marketing para explorar com esse perfil.
        5. "remarketing_strategy": Sugestão concreta de mensagem para enviar amanhã (remarketing).
        6. "suggested_next_steps": Próximos passos recomendados para fechar a venda.

        Responda APENAS o JSON.
        `;

    // Using callOpenAI helper instead of direct client usage to maintain consistency
    const text = await callOpenAI(prompt, apiKey, "gpt-4-turbo-preview", true);

    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const analysis = JSON.parse(cleanText);

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

  const prompt = `
    Você é um Arquiteto de Agentes de IA Especialista.
    Sua tarefa é criar uma configuração técnica completa para um Agente de IA com base na seguinte descrição do usuário:
    
    DESCRIÇÃO DO USUÁRIO: "${description}"

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

module.exports = {
  analyzeChatConversation,
  generateMarketingContent,
  askEliteAssistant,
  analyzeConversationStrategy,
  generateAgentConfig,
  saveAnalysis,
  generateDashboardInsights
};
