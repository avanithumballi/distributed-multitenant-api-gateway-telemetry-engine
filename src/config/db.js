import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongooseOptions = {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    console.log(`📡 MongoDB Atlas Connected Cluster Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`🚨 MongoDB Database Connection Failed: ${error.message}`);
    setTimeout(connectDB, 5000);
  }
};