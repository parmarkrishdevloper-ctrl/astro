// Thin CRUD over the SavedView collection.
//
// The route layer calls these instead of hitting the model directly, so
// validation / defaults / sort order stays consistent across endpoints.

import { SavedView, ISavedView } from '../models/saved-view.model';

export interface SavedViewInput {
  name: string;
  route: string;
  kind?: string;
  snapshot?: any;
  tags?: string[];
  pinned?: boolean;
  chartId?: string;
}

export async function createSavedView(input: SavedViewInput): Promise<ISavedView> {
  if (!input.name || !input.name.trim()) throw new Error('name is required');
  if (!input.route || !input.route.trim()) throw new Error('route is required');
  return SavedView.create({
    name: input.name.trim(),
    route: input.route.trim(),
    kind: (input.kind ?? 'generic').trim() || 'generic',
    snapshot: input.snapshot ?? {},
    tags: Array.isArray(input.tags) ? input.tags : [],
    pinned: !!input.pinned,
    chartId: input.chartId,
  });
}

export async function listSavedViews(opts: { route?: string; pinned?: boolean } = {}) {
  const q: any = {};
  if (opts.route) q.route = opts.route;
  if (typeof opts.pinned === 'boolean') q.pinned = opts.pinned;
  return SavedView.find(q).sort({ pinned: -1, updatedAt: -1 }).lean();
}

export async function getSavedView(id: string) {
  return SavedView.findById(id).lean();
}

export async function updateSavedView(id: string, patch: Partial<SavedViewInput>) {
  const $set: any = {};
  if (patch.name !== undefined)     $set.name = patch.name;
  if (patch.route !== undefined)    $set.route = patch.route;
  if (patch.kind !== undefined)     $set.kind = patch.kind;
  if (patch.snapshot !== undefined) $set.snapshot = patch.snapshot;
  if (patch.tags !== undefined)     $set.tags = patch.tags;
  if (patch.pinned !== undefined)   $set.pinned = !!patch.pinned;
  if (patch.chartId !== undefined)  $set.chartId = patch.chartId;
  // SQLite-backed Repo returns plain JSON docs already — no .lean() needed.
  return SavedView.findByIdAndUpdate(id, { $set }, { new: true });
}

export async function deleteSavedView(id: string) {
  const r = await SavedView.findByIdAndDelete(id);
  return !!r;
}
