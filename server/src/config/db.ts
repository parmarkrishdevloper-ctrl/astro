// Database bootstrap — embedded SQLite (sql.js) for offline-first operation.
// MongoDB has been removed; persistence lives in a single file at
// `JYOTISH_DB_PATH` (defaults to `<cwd>/data/jyotish.sqlite`). The Electron
// shell injects `app.getPath('userData')/jyotish.sqlite` into that env var
// for the packaged build.

import { initDb, getDbPath } from '../db/sqlite';

export async function connectDB(): Promise<void> {
  try {
    await initDb();
    console.log(`[db] sqlite ready → ${getDbPath()}`);
  } catch (err) {
    console.warn(
      `[db] failed to initialise sqlite at ${getDbPath()}. ` +
      `Server will keep running but persistence will not work. ` +
      `Error: ${(err as Error).message}`,
    );
  }
}
