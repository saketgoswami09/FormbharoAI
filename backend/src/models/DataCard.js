import mongoose from 'mongoose';

const dataCardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['job', 'government_exam', 'education', 'travel', 'custom'],
        default: 'custom'
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('DataCard', dataCardSchema);
