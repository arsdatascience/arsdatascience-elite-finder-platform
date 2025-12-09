require('dotenv').config();

console.log('--- AI Setup Check ---');
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);

// Check if keys look valid (brief check)
if (process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY.substring(0, 7) + '...');
} else {
    console.log('⚠️ OPENAI_API_KEY is missing!');
}

console.log('--- Done ---');
