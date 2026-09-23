import app from '../backend/app.js';
import connectDB from '../backend/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error in Vercel Serverless Handler:', error.message);
  }
  return app(req, res);
}
