// Remedy log entries — SQLite-backed.

import { Repo } from '../db/repo';

export type RemedyKind =
  | 'yantra' | 'gemstone' | 'mantra' | 'fasting' | 'donation' | 'ritual' | 'other';
export type RemedyStatus = 'planned' | 'active' | 'paused' | 'completed' | 'abandoned';

export interface IRemedyLog {
  _id: string;
  chartId?: string;
  planet?: string;
  kind: RemedyKind;
  title: string;
  details?: string;
  startedAt?: string;
  endsAt?: string;
  recurrence?: {
    weekdayNum?: number;
    timeOfDay?: string;
    countPerSession?: number;
  };
  progress?: {
    sessionsCompleted: number;
    totalCount?: number;
    targetCount?: number;
    lastSessionAt?: string;
  };
  status: RemedyStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

function rowToDoc(row: any): IRemedyLog {
  return {
    _id: row._id,
    chartId: row.chart_id ?? undefined,
    planet: row.planet ?? undefined,
    kind: row.kind as RemedyKind,
    title: row.title,
    details: row.details ?? undefined,
    startedAt: row.started_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    recurrence: row.recurrence ? safeParse(row.recurrence, undefined) : undefined,
    progress: row.progress ? safeParse(row.progress, undefined) : undefined,
    status: (row.status as RemedyStatus) ?? 'planned',
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function docToRow(doc: any): Record<string, any> {
  return {
    _id:         doc._id,
    chart_id:    doc.chartId ?? null,
    planet:      doc.planet ?? null,
    kind:        doc.kind,
    title:       doc.title,
    details:     doc.details ?? null,
    started_at:  doc.startedAt ?? null,
    ends_at:     doc.endsAt ?? null,
    recurrence:  doc.recurrence != null ? JSON.stringify(doc.recurrence) : null,
    progress:    doc.progress   != null ? JSON.stringify(doc.progress)   : null,
    status:      doc.status ?? 'planned',
    notes:       doc.notes ?? null,
    created_at:  toIso(doc.createdAt),
    updated_at:  toIso(doc.updatedAt),
  };
}

function safeParse<T>(s: any, fb: T): T { try { return JSON.parse(s) as T; } catch { return fb; } }
function toIso(d: any): string {
  if (!d) return new Date().toISOString();
  if (d instanceof Date) return d.toISOString();
  return new Date(d).toISOString();
}

export const RemedyLog = new Repo<IRemedyLog>({
  table: 'remedy_logs',
  rowToDoc,
  docToRow,
  defaults: { status: 'planned' },
});
