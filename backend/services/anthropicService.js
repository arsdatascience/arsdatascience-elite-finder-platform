const Anthropic = require('@anthropic-ai/sdk');

// Modelos Anthropic atualizados (Novembro 2025)
const ClaudeModel = {
    // Claude 4.5 (Mais recente)
    OPUS_4_5: "claude-opus-4-5-20251124",
    SONNET_4_5: "claude-sonnet-4-5-20250929",
    HAIKU_4_5: "claude-haiku-4-5-20251001",

    // Claude 4.1
    OPUS_4_1: "claude-opus-4-1-20250805",

    // Claude 4
    OPUS_4: "claude-opus-4-20250514",
    SONNET_4: "claude-sonnet-4-20250514",

    // Claude 3.7
    SONNET_3_7: "claude-3-7-sonnet-20250219",

    // Claude 3.5 (Legado)
    HAIKU_3_5: "claude-3-5-haiku-20241022",

    // Claude 3 (Legado)
    HAIKU_3: "claude-3-haiku-20240307",
};

// Informações detalhadas dos modelos
const MODEL_INFO = {
    // Claude 4.5
    [ClaudeModel.OPUS_4_5]: {
        name: "Claude Opus 4.5",
        contextWindow: 200000,
        maxOutput: 64000,
        description: "Modelo mais inteligente da Anthropic, líder em raciocínio complexo e coding agêntico",
        features: [
            "extended_thinking",
            "vision",
            "computer_use",
            "tool_use",
            "effort_parameter",
            "context_awareness",
            "tool_search",
            "prompt_injection_resistant",
        ],
        status: "stable",
        category: "opus",
        pricing: { input: 5, output: 25 },
        knowledgeCutoff: "Março 2025",
    },
    [ClaudeModel.SONNET_4_5]: {
        name: "Claude Sonnet 4.5",
        contextWindow: 200000,
        maxOutput: 64000,
        description: "Melhor modelo para agentes complexos e coding, equilíbrio ideal",
        features: [
            "extended_thinking",
            "vision",
            "computer_use",
            "tool_use",
            "context_awareness",
            "tool_search",
            "1m_context_beta",
        ],
        status: "stable",
        category: "sonnet",
        pricing: { input: 3, output: 15 },
        knowledgeCutoff: "Janeiro 2025",
    },
    [ClaudeModel.HAIKU_4_5]: {
        name: "Claude Haiku 4.5",
        contextWindow: 200000,
        maxOutput: 64000,
        description: "Modelo mais rápido com performance quase-frontier, ideal para agentes de alta velocidade",
        features: [
            "extended_thinking",
            "vision",
            "computer_use",
            "tool_use",
            "context_awareness",
            "blazing_fast",
        ],
        status: "stable",
        category: "haiku",
        pricing: { input: 1, output: 5 },
        knowledgeCutoff: "Fevereiro 2025",
    },

    // Claude 4.1
    [ClaudeModel.OPUS_4_1]: {
        name: "Claude Opus 4.1",
        contextWindow: 200000,
        maxOutput: 32000,
        description: "Modelo anterior de alta capacidade para raciocínio avançado",
        features: [
            "extended_thinking",
            "vision",
            "computer_use",
            "tool_use",
            "interleaved_thinking",
        ],
        status: "stable",
        category: "opus",
        pricing: { input: 15, output: 75 },
        knowledgeCutoff: "Abril 2025",
    },

    // Claude 4
    [ClaudeModel.OPUS_4]: {
        name: "Claude Opus 4",
        contextWindow: 200000,
        maxOutput: 32000,
        description: "Flagship anterior com alta capacidade",
        features: ["extended_thinking", "vision", "computer_use", "tool_use"],
        status: "stable",
        category: "opus",
        pricing: { input: 15, output: 75 },
        knowledgeCutoff: "Março 2025",
    },
    [ClaudeModel.SONNET_4]: {
        name: "Claude Sonnet 4",
        contextWindow: 200000,
        maxOutput: 64000,
        description: "Modelo de alta performance com raciocínio excepcional",
        features: [
            "extended_thinking",
            "vision",
            "computer_use",
            "tool_use",
            "context_awareness",
            "1m_context_beta",
        ],
        status: "stable",
        category: "sonnet",
        pricing: { input: 3, output: 15 },
        knowledgeCutoff: "Janeiro 2025",
    },

    // Claude 3.7
    [ClaudeModel.SONNET_3_7]: {
        name: "Claude Sonnet 3.7",
        contextWindow: 200000,
        maxOutput: 128000,
        description: "Modelo com extended thinking pioneiro e output longo (128K com beta header)",
        features: ["extended_thinking", "vision", "tool_use", "128k_output_beta"],
        status: "stable",
        category: "sonnet",
        pricing: { input: 3, output: 15 },
        knowledgeCutoff: "Outubro 2024",
    },

    // Claude 3.5 (Legado)
    [ClaudeModel.HAIKU_3_5]: {
        name: "Claude Haiku 3.5",
        contextWindow: 200000,
        maxOutput: 8192,
        description: "Modelo rápido e compacto (legado)",
        features: ["vision", "tool_use", "fast"],
        status: "legacy",
        category: "haiku",
        pricing: { input: 0.8, output: 4 },
        knowledgeCutoff: "Julho 2024",
    },

    // Claude 3 (Legado)
    [ClaudeModel.HAIKU_3]: {
        name: "Claude Haiku 3",
        contextWindow: 200000,
        maxOutput: 4096,
        description: "Modelo compacto original (legado)",
        features: ["vision", "fast"],
        status: "legacy",
        category: "haiku",
        pricing: { input: 0.25, output: 1.25 },
        knowledgeCutoff: "Agosto 2023",
    },
};

class ClaudeService {
    constructor(apiKey, initialModel = ClaudeModel.SONNET_4_5) {
        if (!apiKey) {
            console.warn('ClaudeService: API Key não fornecida. As chamadas falharão.');
        }
        this.client = new Anthropic({ apiKey });
        this.currentModel = initialModel;
    }

    // Trocar modelo
    setModel(model) {
        this.currentModel = model;
        console.log(`Modelo alterado para: ${MODEL_INFO[model]?.name || model}`);
    }

    // Info do modelo atual
    getCurrentModel() {
        return { id: this.currentModel, ...MODEL_INFO[this.currentModel] };
    }

    // Listar todos os modelos
    static listModels() {
        return Object.entries(MODEL_INFO).map(([id, info]) => ({ id, ...info }));
    }

    // Listar por categoria
    static listModelsByCategory() {
        const categories = {};
        Object.entries(MODEL_INFO).forEach(([id, info]) => {
            if (!categories[info.category]) {
                categories[info.category] = [];
            }
            categories[info.category].push(id);
        });
        return categories;
    }

    // Listar modelos recomendados por caso de uso
    static getRecommendedModel(useCase) {
        const recommendations = {
            complex_reasoning: ClaudeModel.OPUS_4_5,
            agentic_coding: ClaudeModel.OPUS_4_5,
            long_running_agents: ClaudeModel.OPUS_4_5,
            general_coding: ClaudeModel.SONNET_4_5,
            balanced_performance: ClaudeModel.SONNET_4_5,
            cost_effective: ClaudeModel.SONNET_4_5,
            real_time_chat: ClaudeModel.HAIKU_4_5,
            high_volume: ClaudeModel.HAIKU_4_5,
            pair_programming: ClaudeModel.HAIKU_4_5,
            customer_service: ClaudeModel.HAIKU_4_5,
            document_analysis: ClaudeModel.SONNET_4_5,
            legal_analysis: ClaudeModel.OPUS_4_5,
        };
        return recommendations[useCase] || ClaudeModel.SONNET_4_5;
    }

    // Mensagem simples
    async message(prompt, options = {}) {
        const requestBody = {
            model: this.currentModel,
            max_tokens: options.maxTokens ?? 4096,
            messages: [{ role: "user", content: prompt }],
        };

        if (options.systemPrompt) {
            requestBody.system = options.systemPrompt;
        }

        if (options.temperature !== undefined) {
            requestBody.temperature = options.temperature;
        }

        // Effort parameter apenas para Opus 4.5
        if (options.effort && this.currentModel === ClaudeModel.OPUS_4_5) {
            requestBody.effort = options.effort;
        }

        const response = await this.client.messages.create(requestBody);

        const textContent = response.content.find((block) => block.type === "text");
        return textContent?.type === "text" ? textContent.text : "";
    }

    // Chat com histórico
    async chat(messages, options = {}) {
        const requestBody = {
            model: this.currentModel,
            max_tokens: options.maxTokens ?? 4096,
            messages,
        };

        if (options.systemPrompt) {
            requestBody.system = options.systemPrompt;
        }

        if (options.temperature !== undefined) {
            requestBody.temperature = options.temperature;
        }

        const response = await this.client.messages.create(requestBody);

        const textContent = response.content.find((block) => block.type === "text");
        return textContent?.type === "text" ? textContent.text : "";
    }

    // Streaming
    async *stream(prompt, options = {}) {
        const requestBody = {
            model: this.currentModel,
            max_tokens: options.maxTokens ?? 4096,
            messages: [{ role: "user", content: prompt }],
            stream: true,
        };

        if (options.systemPrompt) {
            requestBody.system = options.systemPrompt;
        }

        const stream = await this.client.messages.stream(requestBody);

        for await (const event of stream) {
            if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
            ) {
                yield event.delta.text;
            }
        }
    }

    // Extended Thinking (Opus 4.5, Sonnet 4.5, Haiku 4.5)
    async thinkAndRespond(prompt, options = {}) {
        const requestBody = {
            model: this.currentModel,
            max_tokens: options.maxTokens ?? 16000,
            thinking: {
                type: "enabled",
                budget_tokens: options.budgetTokens ?? 10000,
            },
            messages: [{ role: "user", content: prompt }],
        };

        if (options.systemPrompt) {
            requestBody.system = options.systemPrompt;
        }

        const response = await this.client.messages.create(requestBody);

        let thinking = "";
        let text = "";

        for (const block of response.content) {
            if (block.type === "thinking") {
                thinking = block.thinking;
            } else if (block.type === "text") {
                text = block.text;
            }
        }

        return { thinking, response: text };
    }

    // Análise de imagem (Vision)
    async analyzeImage(imageBase64, prompt, mediaType = "image/jpeg") {
        const response = await this.client.messages.create({
            model: this.currentModel,
            max_tokens: 4096,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType,
                                data: imageBase64,
                            },
                        },
                        {
                            type: "text",
                            text: prompt,
                        },
                    ],
                },
            ],
        });

        const textContent = response.content.find((block) => block.type === "text");
        return textContent?.type === "text" ? textContent.text : "";
    }

    // Tool Use
    async useTools(prompt, tools, options = {}) {
        const response = await this.client.messages.create({
            model: this.currentModel,
            max_tokens: options.maxTokens ?? 4096,
            system: options.systemPrompt,
            tools: tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.input_schema,
            })),
            messages: [{ role: "user", content: prompt }],
        });

        const toolCalls = [];
        let textResponse = "";

        for (const block of response.content) {
            if (block.type === "tool_use") {
                toolCalls.push({ name: block.name, input: block.input });
            } else if (block.type === "text") {
                textResponse = block.text;
            }
        }

        return { response: textResponse, toolCalls };
    }
}

module.exports = { ClaudeService, ClaudeModel, MODEL_INFO };
