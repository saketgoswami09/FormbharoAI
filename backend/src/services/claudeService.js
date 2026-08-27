import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export const extractData = async (fileBuffer, mimeType) => {
    // HARD RULE: Never write document content to disk or console.log it.
    // Ensure fileBuffer is never leaked.

    const base64Image = fileBuffer.toString('base64');
    
    const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
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

export const chatWithClaude = async (history, userMessage) => {
    // Implementation for follow-up chat
    return { response: "Claude response" };
};
