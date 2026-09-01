import { Router } from 'express';
import { uploadDocument, extractDocumentData, chatDocument, mapFieldsToDataCardController } from '../controllers/formController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// All form routes now require authentication
router.use(protect);

// POST /api/upload
router.post('/upload', upload.single('file'), asyncHandler(uploadDocument));

// POST /api/extract
router.post('/extract', asyncHandler(extractDocumentData));

// POST /api/chat
router.post('/chat', asyncHandler(chatDocument));

// POST /api/mapFields
router.post('/mapFields', asyncHandler(mapFieldsToDataCardController));

export default router;

