// React hook wrapping the saved-views API. Provides a local list + CRUD
// helpers so any page can:
//   const { views, save, remove } = useSavedViews({ route: '/kundali' });
//   <button onClick={() => save({ name, route: '/kundali', snapshot })}/>

import { useCallback, useEffect, useState } from 'react';
import { api, SavedView } from '../api/jyotish';

export function useSavedViews(opts: { route?: string; pinned?: boolean } = {}) {
  const { route, pinned } = opts;
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.views.list({ route, pinned });
      setViews(r.views);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load saved views');
    } finally {
      setLoading(false);
    }
  }, [route, pinned]);

  useEffect(() => { void reload(); }, [reload]);

  const save = useCallback(async (input: Partial<SavedView> & { name: string; route: string }) => {
    const r = await api.views.create(input);
    await reload();
    return r.view;
  }, [reload]);

  const update = useCallback(async (id: string, patch: Partial<SavedView>) => {
    const r = await api.views.update(id, patch);
    await reload();
    return r.view;
  }, [reload]);

  const togglePin = useCallback(async (v: SavedView) => {
    if (!v._id) return;
    await api.views.update(v._id, { pinned: !v.pinned });
    await reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    await api.views.delete(id);
    await reload();
  }, [reload]);

  return { views, loading, error, reload, save, update, togglePin, remove };
}
