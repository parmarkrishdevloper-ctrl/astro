// Embedded SQLite via sql.js (pure WASM — no native compilation, no
// electron-rebuild step). Replaces MongoDB for the desktop / offline build.
//
// On boot we either load `JYOTISH_DB_PATH` (set by the Electron shell to
// `app.getPath('userData')/jyotish.sqlite`) or fall back to `data/jyotish.sqlite`
// in the server cwd. Writes are batched: every mutation triggers a debounced
// `persist()` that serialises the in-memory DB to disk. The 250-ms debounce
// is plenty for an interactive desktop workload and avoids hammering the file
// every keystroke.

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let dbPath: string = '';
let persistTimer: NodeJS.Timeout | null = null;
const PERSIST_DEBOUNCE_MS = 250;

export function getDbPath(): string {
  if (process.env.JYOTISH_DB_PATH) return process.env.JYOTISH_DB_PATH;
  return path.resolve(process.cwd(), 'data', 'jyotish.sqlite');
}

/** Resolve the sql-wasm.wasm asset path. sql.js calls this with the file name
 *  it wants to load; we walk known layouts (dev `node_modules`, packaged
 *  Electron resources) until something exists. Falls back to the bare name
 *  so the loader's own discovery still has a chance. */
function locateWasm(file: string): string {
  const candidates = [
    process.env.JYOTISH_SQLJS_WASM_DIR,
    // Standard dev / npm install — workspace hoists deps to repo root
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist'),
    path.join(__dirname, '..', '..', '..', 'node_modules', 'sql.js', 'dist'),
    path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist'),
    // Electron packaged: resources/app.asar.unpacked/node_modules/sql.js/dist
    process.resourcesPath
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist')
      : null,
    process.resourcesPath
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'server', 'node_modules', 'sql.js', 'dist')
      : null,
    process.resourcesPath
      ? path.join(process.resourcesPath, 'node_modules', 'sql.js', 'dist')
      : null,
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    const full = path.join(dir, file);
    if (fs.existsSync(full)) return full;
  }
  return file;
}

/** Initialise sql.js, open or create the DB file, run migrations. */
export async function initDb(): Promise<Database> {
  if (db) return db;
  SQL = await initSqlJs({ locateFile: locateWasm });
  dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  runMigrations(db);
  // Persist a fresh DB so the file exists for next boot.
  if (!fs.existsSync(dbPath)) flushSync();
  console.log('[sqlite] open →', dbPath);
  return db;
}

export function getDb(): Database {
  if (!db) throw new Error('SQLite DB not initialised — call initDb() first.');
  return db;
}

/** Schedule an async persist to disk. Safe to call from any mutation. */
export function persist(): void {
  if (!db) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(flushSync, PERSIST_DEBOUNCE_MS);
}

/** Force-flush synchronously (used on shutdown + after migrations). */
export function flushSync(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
}

/** Close the DB cleanly. Called from server shutdown hooks. */
export function closeDb(): void {
  flushSync();
  if (db) { db.close(); db = null; }
}

// ─── Migrations ─────────────────────────────────────────────────────────────
// One file, idempotent CREATE TABLE IF NOT EXISTS. Add new tables/columns
// here; bumping the user_version pragma is optional since the statements are
// idempotent.

function runMigrations(d: Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS branding (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS charts (
      _id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      relationship TEXT,
      datetime TEXT NOT NULL,
      tz_offset_hours REAL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      place_name TEXT,
      avatar_data_url TEXT,
      life_events TEXT NOT NULL DEFAULT '[]',
      predictions TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '[]',
      voice_memos TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_charts_label ON charts(label);
    CREATE INDEX IF NOT EXISTS idx_charts_relationship ON charts(relationship);
    CREATE INDEX IF NOT EXISTS idx_charts_updated ON charts(updated_at DESC);

    CREATE TABLE IF NOT EXISTS notebook_entries (
      _id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      payload TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_nb_kind_updated ON notebook_entries(kind, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_nb_pinned_updated ON notebook_entries(pinned DESC, updated_at DESC);

    CREATE TABLE IF NOT EXISTS saved_views (
      _id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      route TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'generic',
      snapshot TEXT NOT NULL DEFAULT '{}',
      tags TEXT NOT NULL DEFAULT '[]',
      pinned INTEGER NOT NULL DEFAULT 0,
      chart_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sv_name ON saved_views(name);
    CREATE INDEX IF NOT EXISTS idx_sv_route ON saved_views(route);
    CREATE INDEX IF NOT EXISTS idx_sv_pinned_updated ON saved_views(pinned DESC, updated_at DESC);

    CREATE TABLE IF NOT EXISTS remedy_logs (
      _id TEXT PRIMARY KEY,
      chart_id TEXT,
      planet TEXT,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT,
      started_at TEXT,
      ends_at TEXT,
      recurrence TEXT,
      progress TEXT,
      status TEXT NOT NULL DEFAULT 'planned',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rl_chart_status ON remedy_logs(chart_id, status);
    CREATE INDEX IF NOT EXISTS idx_rl_planet ON remedy_logs(planet);
    CREATE INDEX IF NOT EXISTS idx_rl_kind ON remedy_logs(kind);
  `);
}

// ─── Helpers — safer parameterised exec/query ─────────────────────────────

export function run(sql: string, params: any[] = []): void {
  const d = getDb();
  const stmt = d.prepare(sql);
  try { stmt.bind(params); stmt.step(); }
  finally { stmt.free(); }
  persist();
}

export function all<T = any>(sql: string, params: any[] = []): T[] {
  const d = getDb();
  const stmt = d.prepare(sql);
  const out: T[] = [];
  try {
    stmt.bind(params);
    while (stmt.step()) out.push(stmt.getAsObject() as unknown as T);
  } finally { stmt.free(); }
  return out;
}

export function get<T = any>(sql: string, params: any[] = []): T | null {
  const rows = all<T>(sql, params);
  return rows[0] ?? null;
}

/** Truthy on any of: 'true', 'TRUE', '1', true, 1. */
export function asBool(v: any): boolean {
  return v === 1 || v === '1' || v === true || v === 'true' || v === 'TRUE';
}
