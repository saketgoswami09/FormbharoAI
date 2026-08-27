import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const extractData = async (fileBuffer, mimeType, profileType) => {
    const base64Data = fileBuffer.toString('base64');
    
    let textPrompt = 'Extract relevant personal information from the uploaded document. Return ONLY valid JSON. Avoid hallucinating missing information. Use null for fields that cannot be confidently found. Prefer normalized standard keys.';
    
    // Define base schema
    let properties = {
        fullName: { type: Type.STRING, nullable: true },
        email: { type: Type.STRING, nullable: true },
        phone: { type: Type.STRING, nullable: true },
        address: { type: Type.STRING, nullable: true },
    };

    // Adapt schema based on profile type
    if (profileType === 'job') {
        textPrompt += ' Focus on skills, education, projects, and work experience.';
        properties.skills = { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true };
        properties.projects = { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true };
        properties.workExperience = { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true };
        properties.github = { type: Type.STRING, nullable: true };
        properties.linkedin = { type: Type.STRING, nullable: true };
        properties.portfolio = { type: Type.STRING, nullable: true };
        properties.education = {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                level: { type: Type.STRING, nullable: true },
                institution: { type: Type.STRING, nullable: true },
                boardOrUniversity: { type: Type.STRING, nullable: true },
                yearOfPassing: { type: Type.STRING, nullable: true },
                percentageOrCGPA: { type: Type.STRING, nullable: true }
            }
        };
    } else if (profileType === 'government_exam') {
        textPrompt += ' Focus on personal demographics, family details, and exam-specific categories.';
        properties.dateOfBirth = { type: Type.STRING, nullable: true };
        properties.gender = { type: Type.STRING, nullable: true };
        properties.fatherName = { type: Type.STRING, nullable: true };
        properties.motherName = { type: Type.STRING, nullable: true };
        properties.category = { type: Type.STRING, nullable: true };
        properties.nationality = { type: Type.STRING, nullable: true };
        properties.education = {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                level: { type: Type.STRING, nullable: true },
                institution: { type: Type.STRING, nullable: true },
                boardOrUniversity: { type: Type.STRING, nullable: true },
                yearOfPassing: { type: Type.STRING, nullable: true },
                percentageOrCGPA: { type: Type.STRING, nullable: true }
            }
        };
    } else {
        // Default / Custom generic extraction
        properties.dateOfBirth = { type: Type.STRING, nullable: true };
        properties.gender = { type: Type.STRING, nullable: true };
        properties.fatherName = { type: Type.STRING, nullable: true };
        properties.motherName = { type: Type.STRING, nullable: true };
        properties.education = {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                level: { type: Type.STRING, nullable: true },
                institution: { type: Type.STRING, nullable: true },
                boardOrUniversity: { type: Type.STRING, nullable: true },
                yearOfPassing: { type: Type.STRING, nullable: true },
                percentageOrCGPA: { type: Type.STRING, nullable: true }
            }
        };
    }

    // We use gemini-2.5-flash as the standard robust multimodal model for this task.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: textPrompt }
                ]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: properties
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

