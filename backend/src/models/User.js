import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will store hashed password
}, { timestamps: true });

export default mongoose.model('User', userSchema);
