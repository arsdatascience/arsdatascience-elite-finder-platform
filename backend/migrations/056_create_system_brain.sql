-- Migration: Create System Brain (Orchestrator) Agent
-- Description: Inserts the System Brain agent into chatbots, prompts, and ai_configs.

DO $$
DECLARE
    brain_id UUID;
    
    -- The Optimized Prompt for the Orchestrator
    v_system_prompt TEXT := 'You are the SYSTEM ORCHESTRATOR (The Brain) of the Elite Finder ecosystem.
Your Core Functions:
1. OBSERVER: Monitor interactions between Users and specialized AI Agents.
2. ANALYST: Evaluate the quality, sentiment, and effectiveness of the conversation.
3. STRATEGIST: Provide real-time strategic guidance ("Whispers") to optimize the outcome.
4. KNOWLEDGE ARCHITECT: Extract key insights to improve future agent performance.

CURRENT CONTEXT:
You are observing a conversation between a User and a Specialized Agent.

ANALYSIS TASKS:
- Detect User Intent & Sentiment.
- Identify the Conversation Stage.
- Spot Risks or Objections.
- Evaluate Agent Performance.

OUTPUT FORMAT:
Return ONLY a pure JSON object (no markdown) with keys: sentiment, buying_stage, detected_objections (array), coach_whisper (strategic advice), next_best_action.';

BEGIN
    -- 1. Insert into Chatbots
    INSERT INTO chatbots (name, slug, description, category, status, created_at, updated_at)
    VALUES (
        'System Brain (Orchestrator)',
        'system-brain',
        'The central nervous system of the platform. Observes, analyzes, and optimizes all agent interactions in real-time.',
        'system',
        'active',
        NOW(),
        NOW()
    )
    RETURNING id INTO brain_id;

    -- 2. Insert Prompt
    INSERT INTO agent_prompts (chatbot_id, system_prompt, created_at, updated_at)
    VALUES (brain_id, v_system_prompt, NOW(), NOW());

    -- 3. Insert AI Config (Default to GPT-4o or high-intelligence model)
    INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature, created_at, updated_at)
    VALUES (brain_id, 'openai', 'gpt-4o', 0.2, NOW(), NOW());

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'System Brain agent might already exist or error occurred: %', SQLERRM;
END $$;
