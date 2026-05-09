import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/jyotish',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-insecure-secret',
  ephePath: path.resolve(process.env.EPHE_PATH ?? './ephe'),
  defaultAyanamsa: (process.env.DEFAULT_AYANAMSA ?? 'lahiri') as
    | 'lahiri'
    | 'raman'
    | 'krishnamurti'
    | 'true_chitrapaksha',
  pdfStoragePath: path.resolve(process.env.PDF_STORAGE_PATH ?? './storage/reports'),
};
