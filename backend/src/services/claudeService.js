import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export const extractData = async (fileBuffer, mimeType) => {
    const base64Data = fileBuffer.toString('base64');
    
    const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are an expert data extractor. Extract the personal details from the provided document. Return ONLY valid JSON. Structure the output into standard keys: fullName, email, phone, address, dateOfBirth, gender, educationLevel, etc. Do not include markdown formatting like \`\`\`json.`,
        messages: [{
            role: 'user',
            content: [{
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: base64Data }
            }]
        }]
    });
    
    return response.content[0].text;
};

export const chatWithClaude = async (history, userMessage, extractedData) => {
    const systemPrompt = `You are helping a user fill an exam form.
    Extracted data: ${JSON.stringify(extractedData || {})}.
    If the user asks you to fill fields, provide the exact value to be filled.`;

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: userMessage }]
    });

    return response.content[0].text;
};
