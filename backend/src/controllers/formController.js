import { randomUUID } from 'crypto';
import { createSession, getSession, updateSession } from '../services/sessionService.js';
import { extractData, chatWithGemini } from '../services/geminiService.js';

export const uploadDocument = async (req, res) => {
    if (!req.file) throw new Error('No file uploaded');

    const sessionId = randomUUID();
    console.log(`[formRoutes] /upload generated sessionId: ${sessionId}`);
    createSession(sessionId, {
        fileBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        history: []
    });
    res.json({ sessionId });
};

export const extractDocumentData = async (req, res) => {
    const { sessionId, profileType } = req.body;
    console.log(`[formRoutes] /extract received sessionId: ${sessionId}, profileType: ${profileType}`);
    const session = getSession(sessionId);
    if (!session) {
        return res.status(400).json({ error: 'Invalid or expired session. Please re-upload your document.' });
    }

    // Pass buffer, mime type, and profileType to Gemini service
    const extractedDataString = await extractData(session.fileBuffer, session.mimeType, profileType);

    let parsedData = {};
    try {
        parsedData = JSON.parse(extractedDataString);
    } catch (e) {
        console.error("Failed to parse extracted JSON", e);
        parsedData = { error: "Extraction yielded invalid structure." };
    }

    // Privacy: clear buffer immediately after successful/failed extraction
    updateSession(sessionId, {
        extractedData: parsedData,
        fileBuffer: null
    });

    res.json({ data: parsedData });
};

export const chatDocument = async (req, res) => {
    const { sessionId, message } = req.body;
    const session = getSession(sessionId);
    if (!session) {
        return res.status(400).json({ error: 'Invalid or expired session. Please re-upload your document.' });
    }

    const responseText = await chatWithGemini(session.history || [], message, session.extractedData);

    updateSession(sessionId, {
        history: [...(session.history || []), { role: 'user', content: message }, { role: 'assistant', content: responseText }]
    });

    res.json({ response: responseText });
};
