import { ChatMessage, AnalysisResult, ContentRequest, ContentResult } from "../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const analyzeChatConversation = async (
    messages: ChatMessage[],
    provider?: string,
    model?: string
): Promise<AnalysisResult> => {
    try {
        console.log("📤 Sending analysis request:", { messages, provider, model });
        const response = await fetch(`${API_URL}/api/ai/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages, provider, model }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Analysis Failed:", error);
        throw error;
    }
};

export const generateMarketingContent = async (request: ContentRequest): Promise<ContentResult> => {
    try {
        const response = await fetch(`${API_URL}/api/ai/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Content Generation Failed:", error);
        throw error;
    }
};

export const askEliteAssistant = async (
    history: ChatMessage[],
    question: string,
    provider?: string,
    model?: string
): Promise<string> => {
    try {
        const response = await fetch(`${API_URL}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ history, question, provider, model }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.answer;
    } catch (error) {
        console.error("Chat Assistant Failed:", error);
        return "Desculpe, não consegui conectar ao servidor.";
    }
};
