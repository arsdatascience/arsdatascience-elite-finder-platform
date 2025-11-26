// aiController.js - Implementation using OpenAI and Gemini
// Provider: OpenAI (Custom Endpoint /v1/responses) and Gemini (Google Generative AI)

const { ClaudeService, ClaudeModel } = require('./services/anthropicService');

const getEffectiveApiKey = (provider = 'openai') => {
  if (provider === 'gemini') {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const allKeys = Object.keys(process.env);
      const geminiKey = allKeys.find(k => k.includes('GEMINI') && k.includes('KEY'));
      if (geminiKey) {
        console.log(`⚠️  Using fallback Gemini key: ${geminiKey}`);
        apiKey = process.env[geminiKey];
      }
    }
    if (!apiKey) {
      console.error('⚠️  GEMINI_API_KEY environment variable is not set!');
      return null;
    }
    return apiKey;
  } else if (provider === 'anthropic') {
    let apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('⚠️  ANTHROPIC_API_KEY environment variable is not set!');
      return null;
    }
    return apiKey;
  } else {
    // Default to OpenAI
    let apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const allKeys = Object.keys(process.env);
      const openaiKey = allKeys.find(k => k.includes('OPENAI') && k.includes('KEY'));
      if (openaiKey) {
        console.log(`⚠️  Using fallback OpenAI key: ${openaiKey}`);
        apiKey = process.env[openaiKey];
      }
    }
    if (!apiKey) {
      console.error('⚠️  OPENAI_API_KEY environment variable is not set!');
      return null;
    }
    return apiKey;
  }
};

const formatChatHistory = (messages) => {
  return messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
};

// Helper function to call OpenAI API via new /v1/responses endpoint
const callOpenAI = async (prompt, apiKey, model = "gpt-5.1", jsonMode = false) => {
  const API_URL = "https://api.openai.com/v1/responses";

  const requestBody = {
    model: model,
    input: prompt
  };

  if (jsonMode) {
    requestBody.input += "\n\nIMPORTANT: Return ONLY valid JSON.";
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

    // Correct parsing for GPT-5.1 /v1/responses structure
    let content;
    if (data.output && Array.isArray(data.output) && data.output[0]?.content?.[0]?.text) {
      content = data.output[0].content[0].text;
    } else {
      // Fallback for other potential structures
      content = data.response || data.text || data.choices?.[0]?.message?.content;
    }

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
  const apiKey = getEffectiveApiKey(provider);

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
  const apiKey = getEffectiveApiKey(provider);

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
  const apiKey = getEffectiveApiKey(provider);

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

module.exports = {
  analyzeChatConversation,
  generateMarketingContent,
  askEliteAssistant
};
