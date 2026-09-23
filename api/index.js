import mongoose from 'mongoose';
// Disable Mongoose command buffering globally BEFORE schemas/models are compiled
mongoose.set('bufferCommands', false);

import connectDB from '../backend/config/db.js';
import app from '../backend/app.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('Database Connection Failed in Vercel Handler:', error.message);
    return res.status(500).json({
      success: false,
      message: `Database connection failed (${error.message}). Please ensure 0.0.0.0/0 (Allow Access from Anywhere) is whitelisted in MongoDB Atlas Network Access.`,
    });
  }
  return app(req, res);
}
