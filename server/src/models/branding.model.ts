// Branding singleton — backed by SQLite (offline-first).
//
// Stored as one row keyed by `default` in the `branding` table; the entire
// document is serialised to JSON in the `data` column. Single-doc lookups
// stay simple and we don't have to widen the schema each time we add a
// branding field.

import { all, run } from '../db/sqlite';

export interface IBranding {
  key: string;
  companyName: string;
  tagline?: string;
  logoDataUrl?: string;
  primaryColor: string;
  accentColor: string;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  footerText?: string;
  updatedAt: Date;
}

const DEFAULT_BRANDING: Partial<IBranding> = {
  key: 'default',
  companyName: 'Astrologer Hemraj Laddha',
  tagline: 'Authentic Vedic Astrology',
  primaryColor: '#7c2d12',
  accentColor: '#b45309',
  contact: {},
  footerText: 'For entertainment & guidance only — astrological inferences are not a substitute for professional advice.',
};

function readRow(): Partial<IBranding> | null {
  const rows = all<any>('SELECT data FROM branding WHERE key = ? LIMIT 1', ['default']);
  if (!rows.length) return null;
  try {
    const parsed = JSON.parse(rows[0].data);
    return { ...parsed, key: 'default' };
  } catch {
    return null;
  }
}

function writeRow(doc: Partial<IBranding>): void {
  const merged = { ...DEFAULT_BRANDING, ...doc, key: 'default', updatedAt: new Date() };
  const json = JSON.stringify(merged);
  // sql.js doesn't have a clean ON CONFLICT helper across versions; emulate.
  run('DELETE FROM branding WHERE key = ?', ['default']);
  run('INSERT INTO branding (key, data, updated_at) VALUES (?, ?, ?)',
    ['default', json, new Date().toISOString()]);
}

export async function getBranding(): Promise<Partial<IBranding>> {
  const existing = readRow();
  if (existing) return existing;
  writeRow(DEFAULT_BRANDING);
  return DEFAULT_BRANDING;
}

export async function setBranding(patch: Partial<IBranding>): Promise<Partial<IBranding>> {
  const current = readRow() ?? DEFAULT_BRANDING;
  const merged = { ...current, ...patch, key: 'default' };
  writeRow(merged);
  return merged;
}
