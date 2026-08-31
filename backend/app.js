import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import websiteRoutes from './routes/websiteRoutes.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// Security middlewares
app.use(helmet());

// CORS configuration - read allowed client URL from env or allow all in development
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/websites', websiteRoutes);

// Root route (for API verification)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WebVault API is running',
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
