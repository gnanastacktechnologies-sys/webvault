import mongoose from 'mongoose';
import dns from 'dns';

// Set public DNS resolvers for reliable MongoDB Atlas SRV record resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS server override is restricted in serverless env
}

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
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB connection failed (${error.message}). Attempting local fallback...`);
    try {
      const conn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`Database connection error: ${fallbackError.message}`);
      if (process.env.VERCEL) {
        throw fallbackError;
      }
      process.exit(1);
    }
  }
};

export default connectDB;

