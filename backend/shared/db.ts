import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env file in development
if (process.env.NODE_ENV === 'development') {
  dotenv.config();
}

let cachedDb: Db | null = null;
let client: MongoClient | null = null;

export const connectToDatabase = async (): Promise<Db> => {
  if (cachedDb) {
    return cachedDb;
  }

  const isLocal = process.env.NODE_ENV === 'development';
  const uri = isLocal 
    ? process.env.MONGODB_URI || 'mongodb://localhost:27017/btc-game-dev'
    : process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MongoDB URI is not defined');
  }

  try {
    console.log('Connecting to MongoDB...', { uri, isLocal });
    client = await MongoClient.connect(uri);
    const dbName = isLocal ? 'btc-game-dev' : process.env.MONGODB_DB_NAME;
    
    console.log('Connected to MongoDB, using database:', dbName);
    const db = client.db(dbName);
    
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export const getCollection = async (collectionName: string) => {
  const db = await connectToDatabase();
  return db.collection(collectionName);
};

// Add cleanup function
export const closeConnection = async () => {
  if (client) {
    await client.close();
    cachedDb = null;
    client = null;
    console.log('MongoDB connection closed');
  }
};

// Add this function
export const ensureIndexes = async () => {
  const db = await connectToDatabase();
  
  // Create indexes
  await db.collection('prices').createIndex({ timestamp: -1 });
  console.log('Indexes created');
}; 