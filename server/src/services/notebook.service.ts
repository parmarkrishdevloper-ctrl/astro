// Notebook CRUD — thin wrapper over the SQLite-backed model.

import { NotebookEntry, NotebookKind, INotebookEntry } from '../models/notebook.model';

export interface NotebookEntryDTO {
  id: string;
  kind: NotebookKind;
  title: string;
  body: string;
  payload?: any;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

function toDTO(e: any): NotebookEntryDTO {
  return {
    id: String(e._id),
    kind: e.kind,
    title: e.title,
    body: e.body,
    payload: e.payload,
    tags: e.tags ?? [],
    pinned: !!e.pinned,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function listNotes(kind?: NotebookKind, tag?: string): Promise<NotebookEntryDTO[]> {
  const q: any = {};
  if (kind) q.kind = kind;
  // Tag filter is JSON-array → can't index in pure SQL on sql.js without
  // extensions. Pull all and post-filter in memory; capped at 500 below.
  const docs = await NotebookEntry.find(q).sort({ pinned: -1, updatedAt: -1 }).limit(500);
  const filtered = tag ? docs.filter((d) => Array.isArray(d.tags) && d.tags.includes(tag)) : docs;
  return filtered.map(toDTO);
}

export async function createNote(input: {
  kind: NotebookKind;
  title: string;
  body?: string;
  payload?: any;
  tags?: string[];
  pinned?: boolean;
}): Promise<NotebookEntryDTO | null> {
  const doc = await NotebookEntry.create({
    kind: input.kind,
    title: input.title,
    body: input.body ?? '',
    payload: input.payload,
    tags: input.tags ?? [],
    pinned: !!input.pinned,
  });
  return toDTO(doc);
}

export async function updateNote(id: string, patch: Partial<{
  title: string;
  body: string;
  payload: any;
  tags: string[];
  pinned: boolean;
}>): Promise<NotebookEntryDTO | null> {
  const doc = await NotebookEntry.findByIdAndUpdate(id, patch, { new: true });
  return doc ? toDTO(doc) : null;
}

export async function deleteNote(id: string): Promise<boolean> {
  const r = await NotebookEntry.findByIdAndDelete(id);
  return !!r;
}
