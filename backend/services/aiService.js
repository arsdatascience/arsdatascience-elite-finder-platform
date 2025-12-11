/**
 * AI Service
 * Unified service for AI operations (OpenAI, Anthropic, Gemini)
 */

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ClaudeService } = require('./anthropicService');

class AIService {
    constructor() {
        // Initialize OpenAI
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
            this.openai = new OpenAI({ apiKey: openaiKey });
        } else {
            console.warn('⚠️ OpenAI API Key missing');
            this.openai = null;
        }

        // Initialize Gemini
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
            this.genAI = new GoogleGenerativeAI(geminiKey);
        } else {
            console.warn('⚠️ Gemini API Key missing');
            this.genAI = null;
        }

        // Initialize Anthropic (via Service)
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (anthropicKey) {
            this.claudeService = new ClaudeService(anthropicKey);
        } else {
            console.warn('⚠️ Anthropic API Key missing');
            this.claudeService = null;
        }
    }

    /**
     * Generate embedding (OpenAI only for now)
     */
    async generateEmbedding(text) {
        try {
            if (!this.openai) return [];
            if (!text || text.trim().length === 0) return [];

            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text.substring(0, 8000)
            });

            return response.data[0]?.embedding || [];
        } catch (error) {
            console.error('Error generating embedding:', error.message);
            return [];
        }
    }

    /**
     * Unified Chat Completion
     */
    async chat(options) {
        const {
            messages,
            provider = 'openai',
            model,
            temperature = 0.7,
            max_tokens = 4096,
            system,
            response_format
        } = options;

        try {
            switch (provider) {
                case 'anthropic':
                    return this._chatAnthropic({ messages, model, temperature, max_tokens, system });
                case 'gemini':
                    return this._chatGemini({ messages, model, temperature, max_tokens, system, response_format });
                case 'openai':
                default:
                    return this._chatOpenAI({ messages, model, temperature, max_tokens, response_format, system });
            }
        } catch (error) {
            console.error(`Error in chat completion (${provider}):`, error.message);
            throw error;
        }
    }

    /**
     * OpenAI Implementation
     */
    async _chatOpenAI({ messages, model = 'gpt-4-turbo-preview', temperature, max_tokens, response_format, system }) {
        if (!this.openai) throw new Error('OpenAI API not configured');

        // Prepare messages (inject system prompt if separate)
        const finalMessages = [...messages];
        if (system) {
            finalMessages.unshift({ role: 'system', content: system });
        }

        const params = {
            model,
            messages: finalMessages,
            temperature,
            model,
            messages: finalMessages,
            temperature,
            max_completion_tokens: max_tokens
        };

        if (response_format) params.response_format = response_format;

        return this.openai.chat.completions.create(params);
    }

    /**
     * Anthropic Implementation
     */
    async _chatAnthropic({ messages, model, temperature, max_tokens, system }) {
        if (!this.claudeService) throw new Error('Anthropic API not configured');

        // Convert messages to Anthropic format (user/assistant only, system is separate)
        // Note: Our ClaudeService setup expects prompt string for simple calls or messages array using its internal format?
        // Let's use the explicit `chat` method of our ClaudeService wrapper if it exists, or adapt.
        // Looking at anthropicService.js: class ClaudeService has chat(messages, options)

        // Filter out system messages from array as they go into 'system' param
        const conversation = messages.filter(m => m.role !== 'system');

        // Extract system prompt if embedded in messages
        let systemPrompt = system;
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg) systemPrompt = systemMsg.content;

        if (model) this.claudeService.setModel(model);

        const responseText = await this.claudeService.chat(conversation, {
            systemPrompt,
            temperature,
            maxTokens: max_tokens
        });

        // Map to OpenAI-like response object for consistency
        return {
            choices: [{
                message: { content: responseText }
            }]
        };
    }

    /**
     * Gemini Implementation
     */
    async _chatGemini({ messages, model = 'gemini-1.5-pro', temperature, max_tokens, system, response_format }) {
        if (!this.genAI) throw new Error('Gemini API not configured');

        // Extract system prompt
        let systemPrompt = system;
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg) systemPrompt = systemMsg.content;

        const geminiModel = this.genAI.getGenerativeModel({
            model: model,
            systemInstruction: systemPrompt, // Correct placement for system instruction
            generationConfig: {
                temperature,
                maxOutputTokens: max_tokens,
                responseMimeType: response_format?.type === 'json_object' ? 'application/json' : 'text/plain'
            }
        });

        // Convert messages to Gemini format (user/model)
        const history = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        // The last message is the new prompt
        const lastMsg = history.pop();
        const chat = geminiModel.startChat({
            history: history
            // systemInstruction removed from here
        });

        const result = await chat.sendMessage(lastMsg.parts[0].text);
        const response = await result.response;
        const text = response.text();

        return {
            choices: [{
                message: { content: text }
            }]
        };
    }
}

module.exports = new AIService();
