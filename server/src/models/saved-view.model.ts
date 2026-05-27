// Saved UI views — SQLite-backed.

import { Repo } from '../db/repo';

export interface ISavedView {
  _id: string;
  name: string;
  route: string;
  kind: string;
  snapshot: any;
  tags: string[];
  pinned: boolean;
  chartId?: string;
  createdAt: Date;
  updatedAt: Date;
}

function rowToDoc(row: any): ISavedView {
  return {
    _id: row._id,
    name: row.name,
    route: row.route,
    kind: row.kind ?? 'generic',
    snapshot: safeParse(row.snapshot, {}),
    tags: safeParse(row.tags, [] as string[]),
    pinned: row.pinned === 1,
    chartId: row.chart_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function docToRow(doc: any): Record<string, any> {
  return {
    _id:        doc._id,
    name:       doc.name,
    route:      doc.route,
    kind:       doc.kind ?? 'generic',
    snapshot:   JSON.stringify(doc.snapshot ?? {}),
    tags:       JSON.stringify(doc.tags ?? []),
    pinned:     doc.pinned ? 1 : 0,
    chart_id:   doc.chartId ?? null,
    created_at: toIso(doc.createdAt),
    updated_at: toIso(doc.updatedAt),
  };
}

function safeParse<T>(s: any, fb: T): T { try { return JSON.parse(s) as T; } catch { return fb; } }
function toIso(d: any): string {
  if (!d) return new Date().toISOString();
  if (d instanceof Date) return d.toISOString();
  return new Date(d).toISOString();
}

export const SavedView = new Repo<ISavedView>({
  table: 'saved_views',
  rowToDoc,
  docToRow,
  defaults: { kind: 'generic', snapshot: {}, tags: [], pinned: false },
});
