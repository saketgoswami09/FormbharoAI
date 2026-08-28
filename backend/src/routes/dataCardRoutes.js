import { Router } from 'express';
import { getDataCards, getDataCardById, createDataCard, updateDataCard, deleteDataCard } from '../controllers/dataCardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Apply auth middleware to all routes
router.use(protect);

router.get('/', asyncHandler(getDataCards));
router.get('/:id', asyncHandler(getDataCardById));
router.post('/', asyncHandler(createDataCard));
router.put('/:id', asyncHandler(updateDataCard));
router.delete('/:id', asyncHandler(deleteDataCard));

export default router;

