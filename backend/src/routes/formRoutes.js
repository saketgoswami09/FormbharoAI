import { Router } from 'express';
import { uploadDocument, extractDocumentData, chatDocument } from '../controllers/formController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// POST /api/upload
router.post('/upload', upload.single('file'), asyncHandler(uploadDocument));

// POST /api/extract
router.post('/extract', asyncHandler(extractDocumentData));

// POST /api/chat
router.post('/chat', asyncHandler(chatDocument));

export default router;


