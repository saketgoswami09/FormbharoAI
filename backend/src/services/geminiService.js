import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const extractData = async (fileBuffer, mimeType) => {
    const base64Data = fileBuffer.toString('base64');
    
    // We use gemini-2.5-flash as the standard robust multimodal model for this task.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: 'Extract relevant personal information from the uploaded document. Return ONLY valid JSON. Avoid hallucinating missing information. Use null for fields that cannot be confidently found. Prefer normalized standard keys.' }
                ]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    fullName: { type: Type.STRING, nullable: true },
                    dateOfBirth: { type: Type.STRING, nullable: true },
                    gender: { type: Type.STRING, nullable: true },
                    email: { type: Type.STRING, nullable: true },
                    phone: { type: Type.STRING, nullable: true },
                    address: { type: Type.STRING, nullable: true },
                    fatherName: { type: Type.STRING, nullable: true },
                    motherName: { type: Type.STRING, nullable: true },
                    education: {
                        type: Type.OBJECT,
                        nullable: true,
                        properties: {
                            level: { type: Type.STRING, nullable: true },
                            institution: { type: Type.STRING, nullable: true },
                            boardOrUniversity: { type: Type.STRING, nullable: true },
                            yearOfPassing: { type: Type.STRING, nullable: true },
                            percentageOrCGPA: { type: Type.STRING, nullable: true }
                        }
                    }
                }
            }
        }
    });
    
    return response.text; // Return the JSON string; parsing happens in the route.
};

export const chatWithGemini = async (history, userMessage, extractedData) => {
    const systemInstruction = `You are helping a user fill an exam form.
    Extracted data: ${JSON.stringify(extractedData || {})}.
    If the user asks you to fill fields, provide the exact value to be filled.
    Never invent personal information that is not present in extractedData.
    Clearly indicate when required information is missing.`;

    // Map existing history format {role: 'user'|'assistant', content: string} to Gemini format
    const contents = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));
    
    // Add the current user message
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: systemInstruction
        }
    });

    return response.text;
};

