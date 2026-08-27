import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { createSession, getSession, updateSession } from '../services/sessionService.js';
import { extractData, chatWithClaude } from '../services/claudeService.js';

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
    createSession(sessionId, { 
        fileBuffer: req.file.buffer, 
        mimeType: req.file.mimetype,
        history: [] 
    });
    res.json({ sessionId });
}));

// POST /api/extract
router.post('/extract', asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    const session = getSession(sessionId);
    if (!session) throw new Error('Invalid or expired session');
    
    const extractedData = await extractData(session.fileBuffer, session.mimeType);
    
    // Privacy: clear buffer immediately
    updateSession(sessionId, { 
        extractedData: JSON.parse(extractedData), 
        fileBuffer: null 
    });
    
    res.json({ data: JSON.parse(extractedData) });
}));

// POST /api/chat
router.post('/chat', asyncHandler(async (req, res) => {
    const { sessionId, message } = req.body;
    const session = getSession(sessionId);
    if (!session) throw new Error('Invalid or expired session');
    
    const responseText = await chatWithClaude(session.history || [], message, session.extractedData);
    
    updateSession(sessionId, { 
        history: [...(session.history || []), { role: 'user', content: message }, { role: 'assistant', content: responseText }]
    });
    
    res.json({ response: responseText });
}));

export default router;

