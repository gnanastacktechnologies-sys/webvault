import mongoose from 'mongoose';

// Disable Mongoose command buffering globally so queries fail fast with exact DB connection errors
mongoose.set('bufferCommands', false);

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  const atlasUri = 'mongodb+srv://gnanastacktechnologies_db_user:leO9igKbda93gS4r@cluster0.rbdpeb4.mongodb.net/webvault?retryWrites=true&w=majority';
  const primaryUri = process.env.MONGODB_URI || atlasUri;
  const localUri = 'mongodb://127.0.0.1:27017/webvault';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB connection failed (${error.message}).`);
    if (process.env.VERCEL) {
      throw error;
    }
    try {
      const conn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`Database connection error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;

