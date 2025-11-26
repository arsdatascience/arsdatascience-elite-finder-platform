
export enum AIProvider {
    OPENAI = 'openai',
    GEMINI = 'gemini',
    ANTHROPIC = 'anthropic'
}

export enum OpenAIModel {
    GPT_5 = "gpt-5",
    GPT_5_MINI = "gpt-5-mini",
    GPT_5_NANO = "gpt-5-nano",
    GPT_4O = "gpt-4o",
    GPT_4O_MINI = "gpt-4o-mini",
    GPT_4_1_NANO = "gpt-4.1-nano"
}

export enum GeminiModel {
    GEMINI_3_PRO = "gemini-3-pro-preview",
    GEMINI_2_5_PRO = "gemini-2.5-pro",
    GEMINI_2_5_FLASH = "gemini-2.5-flash",
    GEMINI_2_0_FLASH = "gemini-2.0-flash"
}

export enum ClaudeModel {
    OPUS_4_5 = "claude-opus-4-5-20251124",
    SONNET_4_5 = "claude-sonnet-4-5-20250929",
    HAIKU_4_5 = "claude-haiku-4-5-20251001",
    OPUS_4_1 = "claude-opus-4-1-20250805",
    SONNET_3_7 = "claude-3-7-sonnet-20250219"
}

export const AI_MODELS = {
    [AIProvider.OPENAI]: [
        { id: OpenAIModel.GPT_5, name: 'GPT-5 (Flagship)' },
        { id: OpenAIModel.GPT_5_MINI, name: 'GPT-5 Mini' },
        { id: OpenAIModel.GPT_5_NANO, name: 'GPT-5 Nano' },
        { id: OpenAIModel.GPT_4O, name: 'GPT-4o' },
        { id: OpenAIModel.GPT_4O_MINI, name: 'GPT-4o Mini' },
        { id: OpenAIModel.GPT_4_1_NANO, name: 'GPT-4.1 Nano' }
    ],
    [AIProvider.GEMINI]: [
        { id: GeminiModel.GEMINI_3_PRO, name: 'Gemini 3 Pro (Preview)' },
        { id: GeminiModel.GEMINI_2_5_PRO, name: 'Gemini 2.5 Pro' },
        { id: GeminiModel.GEMINI_2_5_FLASH, name: 'Gemini 2.5 Flash' },
        { id: GeminiModel.GEMINI_2_0_FLASH, name: 'Gemini 2.0 Flash' }
    ],
    [AIProvider.ANTHROPIC]: [
        { id: ClaudeModel.OPUS_4_5, name: 'Claude 4.5 Opus (Latest)' },
        { id: ClaudeModel.SONNET_4_5, name: 'Claude 4.5 Sonnet' },
        { id: ClaudeModel.HAIKU_4_5, name: 'Claude 4.5 Haiku' },
        { id: ClaudeModel.OPUS_4_1, name: 'Claude 4.1 Opus' },
        { id: ClaudeModel.SONNET_3_7, name: 'Claude 3.7 Sonnet (128k)' }
    ]
};
