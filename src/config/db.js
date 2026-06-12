import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongooseOptions = {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rate_limiter_db';
    const conn = await mongoose.connect(mongoUri, mongooseOptions);
    console.log(`📡 MongoDB Connected Cluster Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`🚨 MongoDB Database Connection Failed: ${error.message}`);
    setTimeout(connectDB, 5000);
  }
};