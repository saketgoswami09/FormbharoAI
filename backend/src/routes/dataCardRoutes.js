import { Router } from 'express';
import DataCard from '../models/DataCard.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Apply auth middleware to all routes
router.use(protect);

// GET /api/datacards
router.get('/', asyncHandler(async (req, res) => {
    // Return metadata only
    const dataCards = await DataCard.find({ userId: req.user._id }).select('-data');
    res.json(dataCards);
}));

// GET /api/datacards/:id
router.get('/:id', asyncHandler(async (req, res) => {
    const dataCard = await DataCard.findOne({ _id: req.params.id, userId: req.user._id });
    if (!dataCard) {
        return res.status(404).json({ error: 'DataCard not found' });
    }
    res.json(dataCard);
}));

// POST /api/datacards
router.post('/', asyncHandler(async (req, res) => {
    const { name, type, data } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    const dataCard = await DataCard.create({
        userId: req.user._id,
        name,
        type: type || 'custom',
        data: data || {}
    });
    res.status(201).json(dataCard);
}));

// PUT /api/datacards/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { name, type, data } = req.body;
    
    let dataCard = await DataCard.findOne({ _id: req.params.id, userId: req.user._id });
    if (!dataCard) {
        return res.status(404).json({ error: 'DataCard not found' });
    }
    
    if (name) dataCard.name = name;
    if (type) dataCard.type = type;
    if (data) dataCard.data = data;
    
    await dataCard.save();
    res.json(dataCard);
}));

// DELETE /api/datacards/:id
router.delete('/:id', asyncHandler(async (req, res) => {
    const dataCard = await DataCard.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!dataCard) {
        return res.status(404).json({ error: 'DataCard not found' });
    }
    res.json({ message: 'DataCard removed' });
}));

export default router;
