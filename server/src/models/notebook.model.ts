// Research notebook entries — SQLite-backed.

import { Repo } from '../db/repo';

export type NotebookKind = 'pattern' | 'sample' | 'stat' | 'match' | 'rectify' | 'freeform';

export interface INotebookEntry {
  _id: string;
  kind: NotebookKind;
  title: string;
  body: string;
  payload?: any;
  tags: string[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function rowToDoc(row: any): INotebookEntry {
  return {
    _id: row._id,
    kind: row.kind as NotebookKind,
    title: row.title,
    body: row.body ?? '',
    payload: row.payload ? safeParse(row.payload, undefined) : undefined,
    tags: safeParse(row.tags, [] as string[]),
    pinned: row.pinned === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function docToRow(doc: any): Record<string, any> {
  return {
    _id:        doc._id,
    kind:       doc.kind,
    title:      doc.title,
    body:       doc.body ?? '',
    payload:    doc.payload != null ? JSON.stringify(doc.payload) : null,
    tags:       JSON.stringify(doc.tags ?? []),
    pinned:     doc.pinned ? 1 : 0,
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

export const NotebookEntry = new Repo<INotebookEntry>({
  table: 'notebook_entries',
  rowToDoc,
  docToRow,
  defaults: { body: '', tags: [], pinned: false },
});
