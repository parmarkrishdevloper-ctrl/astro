// Saved charts (people) — SQLite-backed.
//
// One row per chart. The four sub-collections (lifeEvents, predictions,
// notes, voiceMemos) are stored as JSON columns on the chart row — at our
// scale (a few thousand events per chart at most) this keeps reads/writes
// to a single row hit and avoids cross-table joins.
//
// To preserve the existing call-site API (mutate fields on `c`, then
// `await c.save()`), the document returned by `findById` is augmented with
// a bound `save()` method. Sub-doc `_id`s are generated client-side as
// UUIDs on push.

import { randomUUID } from 'node:crypto';
import { Repo } from '../db/repo';

export type RelationshipTag =
  | 'self' | 'spouse' | 'parent' | 'child' | 'sibling' | 'family'
  | 'friend' | 'colleague' | 'client' | 'celebrity' | 'other';

export interface ILifeEvent {
  _id?: any;
  date: string;
  category: string;
  title: string;
  notes?: string;
  snapshot?: {
    maha?: string;
    antar?: string;
    pratyantar?: string;
    transitSummary?: string;
  };
  createdAt: Date;
}

export interface IPrediction {
  _id?: any;
  forDate?: string;
  forDateEnd?: string;
  category: string;
  text: string;
  outcome?: 'hit' | 'miss' | 'partial' | 'pending';
  outcomeNotes?: string;
  createdAt: Date;
  outcomeAt?: Date;
}

export interface INote {
  _id?: any;
  scope: 'chart' | 'planet' | 'house';
  target?: string;
  markdown: string;
  updatedAt: Date;
}

export interface IVoiceMemo {
  _id?: any;
  blobDataUrl: string;
  mimeType: string;
  durationSec?: number;
  transcript?: string;
  scope: 'chart' | 'planet' | 'house';
  target?: string;
  createdAt: Date;
}

export interface IChart {
  _id: string;
  label: string;
  relationship: RelationshipTag;
  datetime: string;
  tzOffsetHours?: number;
  lat: number;
  lng: number;
  placeName?: string;
  avatarDataUrl?: string;
  lifeEvents: ILifeEvent[];
  predictions: IPrediction[];
  notes: INote[];
  voiceMemos: IVoiceMemo[];
  createdAt: Date;
  updatedAt: Date;
  /** Re-persist this row after mutating its sub-collections in place. */
  save: () => Promise<IChart>;
}

// ─── Row <-> doc serialisation ──────────────────────────────────────────────
function rowToDoc(row: any): IChart {
  const ensureIds = <T extends { _id?: any }>(arr: T[]): T[] =>
    (arr ?? []).map((x) => ({ ...x, _id: x._id ?? randomUUID() }));
  const doc: any = {
    _id: row._id,
    label: row.label,
    relationship: row.relationship as RelationshipTag,
    datetime: row.datetime,
    tzOffsetHours: row.tz_offset_hours ?? undefined,
    lat: row.lat,
    lng: row.lng,
    placeName: row.place_name ?? undefined,
    avatarDataUrl: row.avatar_data_url ?? undefined,
    lifeEvents:  ensureIds(safeParse(row.life_events,  [])),
    predictions: ensureIds(safeParse(row.predictions, [])),
    notes:       ensureIds(safeParse(row.notes,       [])),
    voiceMemos:  ensureIds(safeParse(row.voice_memos, [])),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
  doc.save = async () => {
    await baseRepo.saveDoc(doc);
    return doc;
  };
  return doc as IChart;
}

function docToRow(doc: any): Record<string, any> {
  return {
    _id:               doc._id,
    label:             doc.label,
    relationship:      doc.relationship ?? 'other',
    datetime:          doc.datetime,
    tz_offset_hours:   doc.tzOffsetHours ?? null,
    lat:               doc.lat,
    lng:               doc.lng,
    place_name:        doc.placeName ?? null,
    avatar_data_url:   doc.avatarDataUrl ?? null,
    life_events:       JSON.stringify(doc.lifeEvents  ?? []),
    predictions:       JSON.stringify(doc.predictions ?? []),
    notes:             JSON.stringify(doc.notes       ?? []),
    voice_memos:       JSON.stringify(doc.voiceMemos  ?? []),
    created_at:        toIso(doc.createdAt),
    updated_at:        toIso(doc.updatedAt),
  };
}

function safeParse<T>(s: any, fallback: T): T {
  if (s == null) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
function toIso(d: any): string {
  if (!d) return new Date().toISOString();
  if (d instanceof Date) return d.toISOString();
  return new Date(d).toISOString();
}

// ─── Repo ─────────────────────────────────────────────────────────────────
const baseRepo = new Repo<IChart>({
  table: 'charts',
  rowToDoc,
  docToRow,
  defaults: { relationship: 'other', lifeEvents: [], predictions: [], notes: [], voiceMemos: [] },
});

/** Awaitable that supports `.lean()` no-op (results are already plain). */
class ChartSingleQuery implements PromiseLike<IChart | null> {
  constructor(private exec: () => Promise<IChart | null>) {}
  lean(): Promise<IChart | null> { return this.exec(); }
  then<R1 = IChart | null, R2 = never>(
    onF?: ((v: IChart | null) => R1 | PromiseLike<R1>) | null,
    onR?: ((r: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> { return this.exec().then(onF, onR) as PromiseLike<R1 | R2>; }
}

// Public Mongoose-style facade for chart.model.
export const Chart = {
  create: (input: Partial<IChart>) => baseRepo.create(input),
  find:   (filter: Record<string, any> = {}) => baseRepo.find(filter),

  findById: (id: string) =>
    new ChartSingleQuery(() => baseRepo.findById(id).exec()),

  findByIdAndUpdate: (id: string, patch: any, opts?: { new?: boolean }) =>
    new ChartSingleQuery(() => baseRepo.findByIdAndUpdate(id, patch, opts)),

  findByIdAndDelete: (id: string) => baseRepo.findByIdAndDelete(id),
  deleteMany: (filter: Record<string, any> = {}) => baseRepo.deleteMany(filter),
};
