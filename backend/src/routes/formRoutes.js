import express from 'express';
import multer from 'multer';
import { createSession, getSession, updateSession } from '../services/sessionService.js';
import { extractData, chatWithClaude } from '../services/claudeService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload
router.post('/upload', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) throw new Error('No file uploaded');
        const sessionId = createSession({ fileBuffer: req.file.buffer, mimeType: req.file.mimetype });
        res.json({ sessionId });
    } catch (error) {
        next(error);
    }
});

// POST /api/extract
router.post('/extract', async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        const session = getSession(sessionId);
        if (!session) throw new Error('Invalid session');
        
        const extractedData = await extractData(session.data.fileBuffer, session.data.mimeType);
        
        // Clear file buffer after extraction (privacy fix)
        // Intentional: raw document bytes should only live in memory for the duration of the extraction call.
        updateSession(sessionId, { 
            data: { ...session.data, extractedData, fileBuffer: null } 
        });
        
        res.json({ data: extractedData });
    } catch (error) {
        next(error);
    }
});

// POST /api/chat
router.post('/chat', async (req, res, next) => {
    try {
        const { sessionId, message } = req.body;
        const session = getSession(sessionId);
        if (!session) throw new Error('Invalid session');
        
        const responseText = await chatWithClaude(session.history || [], message, session.data.extractedData);
        
        // Update history
        const updatedHistory = [
            ...(session.history || []),
            { role: 'user', content: message },
            { role: 'assistant', content: responseText }
        ];
        
        updateSession(sessionId, { history: updatedHistory });
        
        res.json({ response: responseText });
    } catch (error) {
        next(error);
    }
});

export default router;

