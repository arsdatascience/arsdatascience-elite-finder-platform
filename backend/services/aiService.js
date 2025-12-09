/**
 * AI Service
 * Unified service for AI operations (OpenAI, embeddings, chat)
 */

const OpenAI = require('openai');

class AIService {
    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
        } else {
            console.warn('⚠️ OpenAI API Key missing - AI features will be disabled');
            this.openai = null;
        }
    }

    /**
     * Generate embedding for text using OpenAI
     */
    async generateEmbedding(text) {
        try {
            if (!this.openai) {
                console.warn('Skipping embedding: OpenAI not initialized');
                return [];
            }

            if (!text || text.trim().length === 0) {
                console.warn('Empty text provided for embedding');
                return [];
            }

            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text.substring(0, 8000) // Limit input size
            });

            return response.data[0]?.embedding || [];
        } catch (error) {
            console.error('Error generating embedding:', error.message);
            return [];
        }
    }

    /**
     * Chat completion using OpenAI
     */
    async chat(options) {
        try {
            if (!this.openai) {
                throw new Error('OpenAI API not configured');
            }

            const {
                messages,
                model = 'gpt-4-turbo-preview',
                temperature = 0.7,
                max_tokens = 4096,
                response_format
            } = options;

            const requestParams = {
                model,
                messages,
                temperature,
                max_tokens
            };

            if (response_format) {
                requestParams.response_format = response_format;
            }

            const response = await this.openai.chat.completions.create(requestParams);
            return response;
        } catch (error) {
            console.error('Error in chat completion:', error.message);
            throw error;
        }
    }

    /**
     * Simple text completion
     */
    async complete(prompt, options = {}) {
        if (!this.openai) {
            return 'AI Service Unavailable (Missing Config)';
        }

        const {
            model = 'gpt-4-turbo-preview',
            temperature = 0.7,
            max_tokens = 2048
        } = options;

        try {
            const response = await this.openai.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens
            });

            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Error in completion:', error.message);
            throw error;
        }
    }
}

module.exports = new AIService();
