import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initEphemeris } from './config/ephemeris';
import { errorHandler } from './middleware/errorHandler';
import { localeMiddleware } from './middleware/locale';
import kundaliRoutes from './routes/kundali.routes';
import dashaRoutes from './routes/dasha.routes';
import matchingRoutes from './routes/matching.routes';
import panchangRoutes from './routes/panchang.routes';
import analysisRoutes from './routes/analysis.routes';
import numerologyRoutes from './routes/numerology.routes';
import muhuratRoutes from './routes/muhurat.routes';
import pdfRoutes from './routes/pdf.routes';
import adminRoutes from './routes/admin.routes';
import varshaphalaRoutes from './routes/varshaphala.routes';
import phase9Routes from './routes/phase9.routes';
import phase10Routes from './routes/phase10.routes';
import phase11Routes from './routes/phase11.routes';
import remediesRoutes from './routes/remedies.routes';
import phase13Routes from './routes/phase13.routes';
import phase14Routes from './routes/phase14.routes';
import phase15Routes from './routes/phase15.routes';
import phase16Routes from './routes/phase16.routes';
import phase17Routes from './routes/phase17.routes';
import phase18Routes from './routes/phase18.routes';
import phase19BiometricRoutes from './routes/phase19-biometric.routes';
import phase20WorkflowRoutes from './routes/phase20-workflow.routes';
import worksheetRoutes from './routes/worksheet.routes';
import libraryRoutes from './routes/library.routes';
import learningRoutes from './routes/learning.routes';
import interactiveRoutes from './routes/interactive.routes';
import offlineRoutes from './routes/offline.routes';
import searchRoutes from './routes/search.routes';
import qualityRoutes from './routes/quality.routes';
import geoRoutes from './routes/geo.routes';

async function main() {
  initEphemeris();
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(localeMiddleware);

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'jyotish-pro',
      version: '0.1.0',
      time: new Date().toISOString(),
    });
  });

  app.use('/api/kundali', kundaliRoutes);
  app.use('/api/dasha', dashaRoutes);
  app.use('/api/matching', matchingRoutes);
  app.use('/api/panchang', panchangRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/numerology', numerologyRoutes);
  app.use('/api/muhurat', muhuratRoutes);
  app.use('/api/pdf', pdfRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/varshaphala', varshaphalaRoutes);
  app.use('/api/remedies', remediesRoutes);
  app.use('/api/specialty', phase13Routes);
  app.use('/api', phase14Routes);
  app.use('/api', phase15Routes);
  app.use('/api', phase16Routes);
  app.use('/api', phase17Routes);
  app.use('/api', phase18Routes);
  app.use('/api', phase19BiometricRoutes);
  app.use('/api', phase20WorkflowRoutes);
  app.use('/api', phase9Routes);
  app.use('/api', phase10Routes);
  app.use('/api', phase11Routes);
  app.use('/api/worksheet', worksheetRoutes);
  app.use('/api/library', libraryRoutes);
  app.use('/api/learn', learningRoutes);
  app.use('/api/interactive', interactiveRoutes);
  app.use('/api/offline', offlineRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/quality', qualityRoutes);
  app.use('/api/geo', geoRoutes);

  // ─── Static client (production) ──────────────────────────────────────────
  // Serve the built React bundle if available. Mount it AFTER the API routes 
  // so /api/* still wins, and add a SPA fallback for React-Router.
  const clientDist = resolveClientDist();
  if (clientDist) {
    console.log(`[client] serving static → ${clientDist}`);
    app.use(express.static(clientDist));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`[server] listening → http://localhost:${env.port}`);
    console.log(`[server] try    → http://localhost:${env.port}/api/health`);
    console.log(`[server] verify → http://localhost:${env.port}/api/kundali/verify`);
  });

  // Shutdown handler
  const shutdown = (sig: string) => {
    console.log(`[server] ${sig} received — exiting`);
    process.exit(0);
  };
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}


/** Locate the built client bundle. Honours JYOTISH_CLIENT_DIST first, then
 *  walks common layouts. Returns null if nothing is found. */
function resolveClientDist(): string | null {
  const candidates: string[] = [];
  if (process.env.JYOTISH_CLIENT_DIST) candidates.push(process.env.JYOTISH_CLIENT_DIST);
  candidates.push(path.resolve(process.cwd(), 'client', 'dist'));
  candidates.push(path.resolve(process.cwd(), '..', 'client', 'dist'));

  for (const c of candidates) {
    if (c && fs.existsSync(path.join(c, 'index.html'))) return c;
  }
  return null;
}


main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
