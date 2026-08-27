import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import formRoutes from './routes/formRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dataCardRoutes from './routes/dataCardRoutes.js';
import { errorHandler } from './utils/errorHandler.js';
import { connectDB } from './config/db.js';

// Validate Env
if (!process.env.GEMINI_API_KEY || !process.env.JWT_SECRET || !process.env.MONGODB_URI) {
    console.error('FATAL ERROR: Missing required environment variables (GEMINI_API_KEY, JWT_SECRET, MONGODB_URI).');
    process.exit(1);
}

// Connect Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.EXTENSION_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/datacards', dataCardRoutes);
app.use('/api', formRoutes); // Contains /upload, /extract, /chat

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
