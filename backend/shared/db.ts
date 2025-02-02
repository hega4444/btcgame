import { MongoClient, Db } from 'mongodb';

let cachedDb: Db | null = null;

export const connectToDatabase = async (): Promise<Db> => {
  if (cachedDb) {
    return cachedDb;
  }

  const isLocal = process.env.NODE_ENV === 'development';
  const uri = isLocal 
    ? 'mongodb://localhost:27017/btc-game'
    : process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MongoDB URI is not defined');
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db(isLocal ? 'btc-game' : process.env.MONGODB_DB_NAME);
    
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export const getCollection = async (collectionName: string) => {
  const db = await connectToDatabase();
  return db.collection(collectionName);
}; 