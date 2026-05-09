// Backup / restore service.
//
// Exports the entire personal knowledge base (all Chart documents) as a
// single JSON snapshot. Supports optional passphrase-based AES-256-GCM
// encryption so the backup can safely live in a cloud drive.
//
// File format when encrypted:
//   { format: 'jyotishpro-backup-v1', encrypted: true,
//     kdf: 'pbkdf2-sha256', iterations: 210000, salt, iv, tag, ciphertext }
//
// Unencrypted file: raw JSON with format marker instead of ciphertext.

import crypto from 'crypto';
import { Chart } from '../models/chart.model';

const FORMAT = 'jyotishpro-backup-v1';
const PBKDF2_ITERATIONS = 210_000;  // OWASP 2023 recommendation for SHA-256
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;  // 256-bit key
const TAG_LEN = 16;

export interface BackupEncryptedEnvelope {
  format: typeof FORMAT;
  encrypted: true;
  createdAt: string;
  kdf: 'pbkdf2-sha256';
  iterations: number;
  salt: string;    // base64
  iv: string;      // base64
  tag: string;     // base64
  ciphertext: string;   // base64
}

export interface BackupPlainEnvelope {
  format: typeof FORMAT;
  encrypted: false;
  createdAt: string;
  payload: { charts: any[] };
}

export type BackupEnvelope = BackupEncryptedEnvelope | BackupPlainEnvelope;

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
}

function encrypt(plaintext: string, passphrase: string): BackupEncryptedEnvelope {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    format: FORMAT,
    encrypted: true,
    createdAt: new Date().toISOString(),
    kdf: 'pbkdf2-sha256',
    iterations: PBKDF2_ITERATIONS,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: enc.toString('base64'),
  };
}

function decrypt(env: BackupEncryptedEnvelope, passphrase: string): string {
  const salt = Buffer.from(env.salt, 'base64');
  const iv = Buffer.from(env.iv, 'base64');
  const tag = Buffer.from(env.tag, 'base64');
  const ct = Buffer.from(env.ciphertext, 'base64');
  const key = deriveKey(passphrase, salt);
  const dec = crypto.createDecipheriv('aes-256-gcm', key, iv);
  dec.setAuthTag(tag);
  const out = Buffer.concat([dec.update(ct), dec.final()]);
  return out.toString('utf8');
}

/** Export the entire knowledge base as a single envelope (encrypted if a
 *  passphrase is provided). Binary voice memos and images ride along as
 *  base64 data-URLs already stored in the DB, so no separate blob handling. */
export async function exportBackup(passphrase?: string): Promise<BackupEnvelope> {
  const charts = await Chart.find({}).lean();
  const payload = { charts };
  if (passphrase && passphrase.length > 0) {
    return encrypt(JSON.stringify(payload), passphrase);
  }
  return {
    format: FORMAT,
    encrypted: false,
    createdAt: new Date().toISOString(),
    payload,
  };
}

export interface RestoreOptions {
  envelope: BackupEnvelope;
  passphrase?: string;
  /** If true, drop existing charts before importing. Default false — merge. */
  replaceExisting?: boolean;
}

export interface RestoreResult {
  imported: number;
  skipped: number;
  replaced: boolean;
}

export async function restoreBackup(opts: RestoreOptions): Promise<RestoreResult> {
  const { envelope, passphrase, replaceExisting } = opts;
  if (envelope.format !== FORMAT) throw new Error(`Unknown format: ${(envelope as any).format}`);

  let payload: { charts: any[] };
  if (envelope.encrypted) {
    if (!passphrase) throw new Error('Passphrase required to decrypt backup');
    const text = decrypt(envelope, passphrase);
    payload = JSON.parse(text);
  } else {
    payload = envelope.payload;
  }

  if (replaceExisting) {
    await Chart.deleteMany({});
  }

  let imported = 0;
  let skipped = 0;
  for (const c of payload.charts ?? []) {
    // Don't import with existing _id (Mongo will reject duplicates); re-create.
    const { _id, ...rest } = c;
    try {
      await Chart.create(rest);
      imported++;
    } catch (e) {
      skipped++;
    }
  }
  return { imported, skipped, replaced: !!replaceExisting };
}

// Exported helpers for tests
export const __test_only__ = { encrypt, decrypt };
