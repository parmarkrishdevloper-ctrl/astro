import mongoose from 'mongoose';
import { Chart } from '../models/chart.model';
import { BrandingModel } from '../models/branding.model';
import { NotebookEntry } from '../models/notebook.model';
import { env } from '../config/env';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jyotish-pro';
  console.log(`[seed] connecting to ${uri}...`);
  await mongoose.connect(uri);

  // 1. Seed Branding
  console.log('[seed] checking branding...');
  const brandingCount = await BrandingModel.countDocuments();
  if (brandingCount === 0) {
    await BrandingModel.create({
      companyName: 'Astrologer Hemraj Laddha',
      tagline: 'Authentic Vedic Astrology',
      primaryColor: '#7c2d12',
      accentColor: '#b45309',
      contact: {
        email: 'info@hemrajladdha.com',
        website: 'https://hemrajladdha.com'
      },
      footerText: 'For entertainment & guidance only — astrological inferences are not a substitute for professional advice.'
    });
    console.log('[seed] default branding created');
  }

  // 2. Seed a Sample Chart
  console.log('[seed] checking charts...');
  const chartCount = await Chart.countDocuments();
  if (chartCount === 0) {
    await Chart.create({
      label: 'Sample Chart',
      relationship: 'self',
      datetime: '1990-01-01T12:00:00Z',
      tzOffsetHours: 5.5,
      lat: 28.6139,
      lng: 77.2090,
      placeName: 'New Delhi, India',
      lifeEvents: [],
      predictions: [],
      notes: [],
      voiceMemos: []
    });
    console.log('[seed] sample chart created');
  }

  // 3. Seed Sample Notebook Entry
  console.log('[seed] checking notebook...');
  const noteCount = await NotebookEntry.countDocuments();
  if (noteCount === 0) {
    await NotebookEntry.create({
      kind: 'freeform',
      title: 'Welcome to Jyotish Pro',
      body: 'This is your research notebook. You can use it to track patterns, save statistics, and organize your astrological research.',
      tags: ['welcome', 'tutorial'],
      pinned: true
    });
    console.log('[seed] welcome note created');
  }

  console.log('[seed] success! closing connection.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('[seed] fatal error:', err);
  process.exit(1);
});
