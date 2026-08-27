import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { createSession, getSession, updateSession } from '../services/sessionService.js';
import { extractData, chatWithGemini } from '../services/geminiService.js';

const router = Router();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, or PDF allowed.'));
        }
    }
});

// Helper for error handling
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/upload
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) throw new Error('No file uploaded');
    
    const sessionId = randomUUID();
    console.log(`[formRoutes] /upload generated sessionId: ${sessionId}`);
    createSession(sessionId, { 
        fileBuffer: req.file.buffer, 
        mimeType: req.file.mimetype,
        history: [] 
    });
    res.json({ sessionId });
}));

// POST /api/extract
router.post('/extract', asyncHandler(async (req, res) => {
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
}));

// POST /api/chat
router.post('/chat', asyncHandler(async (req, res) => {
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
}));

export default router;

