import { randomUUID } from 'crypto';
import { createSession, getSession, updateSession } from '../services/sessionService.js';
import { extractData, chatWithGemini, mapFieldsToDataCard } from '../services/geminiService.js';
import DataCard from '../models/DataCard.js';

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

    const validProfileTypes = ['job', 'government_exam', 'education', 'travel', 'custom'];
    if (!profileType) {
        return res.status(400).json({ error: 'profileType is required.', validTypes: validProfileTypes });
    }
    if (!validProfileTypes.includes(profileType)) {
        return res.status(400).json({ error: `Invalid profileType "${profileType}".`, validTypes: validProfileTypes });
    }

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
export const mapFieldsToDataCardController = async (req, res) => {
    const { detectedFields, dataCardId } = req.body;
    
    if (!detectedFields || !dataCardId) {
        return res.status(400).json({ error: 'detectedFields and dataCardId are required.' });
    }

    const dataCard = await DataCard.findOne({ _id: dataCardId, userId: req.user._id });
    if (!dataCard) {
        return res.status(404).json({ error: 'DataCard not found or unauthorized.' });
    }

    // Flatten keys to pass to the AI
    const dataCardKeys = [];
    const flattenKeys = (obj, prefix = '') => {
        for (const [k, v] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                flattenKeys(v, newKey);
            } else {
                dataCardKeys.push(newKey);
            }
        }
    };
    flattenKeys(dataCard.data || {});

    const mapping = await mapFieldsToDataCard(detectedFields, dataCardKeys);
    res.json({ mapping });
};
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
