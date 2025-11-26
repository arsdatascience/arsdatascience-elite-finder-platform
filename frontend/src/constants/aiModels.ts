
export enum AIProvider {
    OPENAI = 'openai',
    GEMINI = 'gemini'
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

export const AI_MODELS = {
    [AIProvider.OPENAI]: [
        { id: OpenAIModel.GPT_5, name: 'GPT-5' },
        { id: OpenAIModel.GPT_5_MINI, name: 'GPT-5 Mini' },
        { id: OpenAIModel.GPT_5_NANO, name: 'GPT-5 Nano' },
        { id: OpenAIModel.GPT_4O, name: 'GPT-4o' },
        { id: OpenAIModel.GPT_4O_MINI, name: 'GPT-4o Mini' },
        { id: OpenAIModel.GPT_4_1_NANO, name: 'GPT-4.1 Nano' }
    ],
    [AIProvider.GEMINI]: [
        { id: GeminiModel.GEMINI_3_PRO, name: 'Gemini 3 Pro' },
        { id: GeminiModel.GEMINI_2_5_PRO, name: 'Gemini 2.5 Pro' },
        { id: GeminiModel.GEMINI_2_5_FLASH, name: 'Gemini 2.5 Flash' },
        { id: GeminiModel.GEMINI_2_0_FLASH, name: 'Gemini 2.0 Flash' }
    ]
};
