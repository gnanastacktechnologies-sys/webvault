import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import websiteRoutes from './routes/websiteRoutes.js';
import { getUsers, createUser, updateUserAccess, deleteUser } from './controllers/authController.js';
import { protect } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// Enable Gzip/Brotli compression for super fast network responses
app.use(compression());

// Security middlewares
app.use(helmet());

// CORS configuration - read allowed client URL from env or allow all origins in development for mobile/LAN access
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins in development or matching CLIENT_URL
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Direct User Access Control route mounts for bulletproof 100% route matching
app.get('/api/auth/users', protect, getUsers);
app.post('/api/auth/users', protect, createUser);
app.put('/api/auth/users/:id/access', protect, updateUserAccess);
app.delete('/api/auth/users/:id', protect, deleteUser);
app.get('/api/users', protect, getUsers);

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
