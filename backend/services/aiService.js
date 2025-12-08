/**
 * AI Service
 * Unified service for AI operations (OpenAI, embeddings, chat)
 */

const OpenAI = require('openai');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    /**
     * Generate embedding for text using OpenAI
     */
    async generateEmbedding(text) {
        try {
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
