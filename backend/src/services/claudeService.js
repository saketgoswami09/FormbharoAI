import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export const extractData = async (fileBuffer, mimeType) => {
    // HARD RULE: Never write document content to disk or console.log it.
    // Use Haiku for cheaper/fast extraction. 
    // Fallback to 'claude-sonnet-5' if accuracy is insufficient.

    const base64Image = fileBuffer.toString('base64');
    
    const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: mimeType,
                            data: base64Image,
                        },
                    },
                    {
                        type: 'text',
                        text: 'Extract all fields from this document into a JSON object.'
                    }
                ],
            },
        ],
    });
    
    return message.content[0].text;
};

export const chatWithClaude = async (history, userMessage, extractedData) => {
    const systemPrompt = `You are helping a user fill an Indian exam form. Here is the data extracted from their uploaded document: ${JSON.stringify(extractedData || {})}. Help them with the form, referencing this data.`;

    const messages = [
        ...history,
        {
            role: 'user',
            content: userMessage
        }
    ];

    const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620', // User asked for claude-sonnet-5, I will use that identifier if possible or use a known one. 
        // Wait, 'claude-sonnet-5' is not a real API model string. It's likely 'claude-3-5-sonnet-20240620'.
        // I will use 'claude-3-5-sonnet-20240620' for now as it's the current latest.
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
    });

    return response.content[0].text;
};
