import DataCard from '../models/DataCard.js';

export const getDataCards = async (req, res) => {
    // Return metadata only
    const dataCards = await DataCard.find({ userId: req.user._id }).select('-data');
    res.json(dataCards);
};

export const getDataCardById = async (req, res) => {
    const dataCard = await DataCard.findOne({ _id: req.params.id, userId: req.user._id });
    if (!dataCard) {
        return res.status(404).json({ error: 'DataCard not found' });
    }
    res.json(dataCard);
};

export const createDataCard = async (req, res) => {
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
};

export const updateDataCard = async (req, res) => {
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
};

export const deleteDataCard = async (req, res) => {
    const dataCard = await DataCard.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!dataCard) {
        return res.status(404).json({ error: 'DataCard not found' });
    }
    res.json({ message: 'DataCard removed' });
};
