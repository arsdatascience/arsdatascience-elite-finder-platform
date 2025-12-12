const pool = require('../db');
const aiController = require('../aiController');

// Get Agent Public Info by Slug
exports.getAgentBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        // 1. Fetch Basic Info (chatbots table)
        // Schema: id, name, description, slug, category, status (No avatar)
        const agentResult = await pool.query(
            `SELECT id, name, description, slug, category 
             FROM chatbots 
             WHERE slug = $1 AND status = 'active'`,
            [slug]
        );

        if (agentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found or inactive' });
        }

        const agent = agentResult.rows[0];

        // 2. Fetch System Prompt (agent_prompts table) - Optional for public view, but needed for chat
        // We might not want to expose the raw prompt to the public GET endpoint unless necessary for the UI (rarely is).
        // For the "Welcome" message, we might generate it or use description.

        // Return Public Data (Add placeholder avatar if needed by frontend)
        const publicData = {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            slug: agent.slug,
            category: agent.category,
            avatar: null // Frontend handles null with default icon
        };

        res.json(publicData);
    } catch (error) {
        console.error('Error fetching public agent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Handle Public Chat
exports.handlePublicChat = async (req, res) => {
    const { slug } = req.params;
    const { messages, sessionId } = req.body;

    try {
        // 1. Fetch Agent (chatbots)
        const agentResult = await pool.query(
            `SELECT id, name FROM chatbots WHERE slug = $1 AND status = 'active'`,
            [slug]
        );

        if (agentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        const agent = agentResult.rows[0];

        // 2. Fetch System Prompt
        const promptResult = await pool.query(
            `SELECT system_prompt FROM agent_prompts WHERE chatbot_id = $1`,
            [agent.id]
        );
        const systemPrompt = promptResult.rows[0]?.system_prompt || 'You are a helpful AI assistant.';

        // 3. Fetch AI Config
        const configResult = await pool.query(
            `SELECT provider, model, temperature FROM agent_ai_configs WHERE chatbot_id = $1`,
            [agent.id]
        );
        const aiConfig = configResult.rows[0] || { provider: 'openai', model: 'gpt-4o', temperature: 0.7 };

        // 4. Construct System Message
        const systemMessage = {
            role: 'system',
            content: systemPrompt
        };

        // 5. Call AI (Using Internal Method from aiController if available, or manual call)
        // Since we cannot easily import the private `generateResponse` from aiController if it's not exported,
        // we will check if `aiController.generateMarketingContent` logic can be reused or if we need to call the services directly.
        // For reliability, let's use the services directly here if needed, or better:
        // Reuse the `askEliteAssistant` logic but bypass the "user owner" check since it's public.

        // We will construct the request to appropriate service.
        // Importing services:
        const { ClaudeService } = require('../services/anthropicService');
        // We need OpenAI service. Usually standard `aiController` uses `openai` library or `axios`.
        // Let's try to usage `aiController.generateResponse` if I can modify aiController to export it. 
        // CHECK: aiController.js exports.

        // Since I cannot easily modify aiController exports without risk, I will implement a robust call here using the same env vars.

        let responseContent = '';

        // Simple Switch for MVP
        if (aiConfig.provider === 'anthropic' || aiConfig.model.includes('claude')) {
            const claudeService = new ClaudeService();
            responseContent = await claudeService.generateMessage({
                model: aiConfig.model,
                messages: [systemMessage, ...messages],
                temperature: aiConfig.temperature
            });
        } else {
            // OpenAI / Default
            const OpenAI = require('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Use system key for public agents

            const completion = await openai.chat.completions.create({
                model: aiConfig.model || 'gpt-4-turbo',
                messages: [systemMessage, ...messages],
                temperature: parseFloat(aiConfig.temperature || 0.7)
            });
            responseContent = completion.choices[0].message.content;
        }

        res.json({ content: responseContent });

    } catch (error) {
        console.error('Error in public chat:', error);
        res.status(500).json({ error: 'Failed to process message: ' + error.message });
    }
};
