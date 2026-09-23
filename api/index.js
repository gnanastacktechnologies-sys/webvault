import app from '../backend/app.js';
import connectDB from '../backend/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error in Vercel Serverless Handler:', error.message);
    return res.status(500).json({
      success: false,
      message: `Database Connection Failed: ${error.message}. Please check MongoDB Atlas IP Whitelist (allow 0.0.0.0/0) and MONGODB_URI.`,
    });
  }
  return app(req, res);
}
