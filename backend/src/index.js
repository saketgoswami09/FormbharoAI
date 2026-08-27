import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import formRoutes from './routes/formRoutes.js';
import { errorHandler } from './utils/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configured to allow only the extension
app.use(cors({
  origin: process.env.EXTENSION_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api', formRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
