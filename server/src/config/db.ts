import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jyotish-pro';
  try {
    await mongoose.connect(uri);
    console.log(`[db] mongodb ready → ${uri}`);
  } catch (err) {
    console.error(
      `[db] failed to connect to mongodb at ${uri}. ` +
      `Error: ${(err as Error).message}`,
    );
    process.exit(1);
  }
}

