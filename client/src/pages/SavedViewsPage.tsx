// Saved Views — browse, pin, rename, and re-open any UI snapshot.
//
// Click a row and it navigates you back to the original route, carrying the
// stored snapshot in history state. The target page reads history.state and
// rehydrates its form/filters.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, PageShell, Pill, ErrorBanner, EmptyState } from '../components/ui/Card';
import { useSavedViews } from '../hooks/useSavedViews';
import { SavedView } from '../api/jyotish';
import { useT } from '../i18n';

type T = (key: string, fallback?: string) => string;

export function SavedViewsPage() {
  const { t } = useT();
  const [filterRoute, setFilterRoute] = useState<string>('');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { views, loading, error, reload, remove, togglePin, update } =
    useSavedViews(filterRoute ? { route: filterRoute } : {});

  // Unique routes for the filter dropdown (seeded from loaded list).
  const routes = useMemo(() => {
    return Array.from(new Set(views.map((v) => v.route))).sort();
  }, [views]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return views;
    return views.filter((v) =>
      v.name.toLowerCase().includes(q)
      || (v.tags ?? []).some((t) => t.toLowerCase().includes(q))
      || v.route.toLowerCase().includes(q),
    );
  }, [views, query]);

  const openView = (v: SavedView) => {
    // Pass the snapshot via history.state so the target page can rehydrate.
    navigate(v.route, { state: { savedView: v } });
  };

  const pinned   = filtered.filter((v) => v.pinned);
  const regular  = filtered.filter((v) => !v.pinned);

  return (
    <PageShell
      title={t('views.title', 'Saved Views')}
      subtitle={t('views.subtitle', 'Bookmark and return to any configuration — birth charts, transit windows, tarot spreads, muhurta searches.')}
    >
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* ── LEFT: filters ──────────────────────────────────────────── */}
        <aside className="space-y-4">
          <Card title={t('views.filters', 'Filters')}>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-vedicMaroon/60 mb-1">
                  {t('views.search', 'Search')}
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('views.searchPlaceholder', 'Name, tag, or route')}
                  className="w-full rounded border border-vedicGold/40 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-vedicMaroon/60 mb-1">
                  {t('views.route', 'Route')}
                </label>
                <select
                  value={filterRoute}
                  onChange={(e) => setFilterRoute(e.target.value)}
                  className="w-full rounded border border-vedicGold/40 px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">{t('views.allRoutes', 'All routes')}</option>
                  {routes.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button
                onClick={() => reload()}
                className="w-full rounded-md border border-vedicGold/40 bg-white text-vedicMaroon text-xs font-medium py-1.5 hover:bg-parchment"
              >
                {t('views.refresh', '↻ Refresh')}
              </button>
              <div className="text-[11px] text-vedicMaroon/60 italic">
                {t('views.tip', 'Tip: add views from any page using the ⭐ Save view button.')}
              </div>
            </div>
          </Card>
        </aside>

        {/* ── RIGHT: list ───────────────────────────────────────────── */}
        <section className="space-y-6">
          {loading && (
            <div className="text-sm text-vedicMaroon/60 italic">{t('views.loading', 'Loading…')}</div>
          )}

          {!loading && filtered.length === 0 && (
            <EmptyState>
              {query || filterRoute
                ? t('views.emptyFiltered', 'No views match your filters.')
                : t('views.emptyAll', 'No saved views yet. Click ⭐ Save view on any page to bookmark it.')}
            </EmptyState>
          )}

          {pinned.length > 0 && (
            <Card title={t('views.pinned', 'Pinned ({n})').replace('{n}', String(pinned.length))}>
              <div className="space-y-2">
                {pinned.map((v) => (
                  <ViewRow
                    key={v._id}
                    view={v}
                    t={t}
                    onOpen={() => openView(v)}
                    onPin={() => togglePin(v)}
                    onRename={async (name) => { if (v._id) await update(v._id, { name }); }}
                    onDelete={async () => { if (v._id && confirm(t('views.confirmDelete', 'Delete "{name}"?').replace('{name}', v.name))) await remove(v._id); }}
                  />
                ))}
              </div>
            </Card>
          )}

          {regular.length > 0 && (
            <Card title={t('views.allViews', 'All views ({n})').replace('{n}', String(regular.length))}>
              <div className="space-y-2">
                {regular.map((v) => (
                  <ViewRow
                    key={v._id}
                    view={v}
                    t={t}
                    onOpen={() => openView(v)}
                    onPin={() => togglePin(v)}
                    onRename={async (name) => { if (v._id) await update(v._id, { name }); }}
                    onDelete={async () => { if (v._id && confirm(t('views.confirmDelete', 'Delete "{name}"?').replace('{name}', v.name))) await remove(v._id); }}
                  />
                ))}
              </div>
            </Card>
          )}
        </section>
      </div>
    </PageShell>
  );
}

// ─── View row ───────────────────────────────────────────────────────────────

function ViewRow({
  view, t, onOpen, onPin, onRename, onDelete,
}: {
  view: SavedView;
  t: T;
  onOpen: () => void;
  onPin: () => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(view.name);

  const save = async () => {
    if (draft.trim() && draft !== view.name) await onRename(draft.trim());
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-vedicGold/20 bg-white hover:bg-parchment/60 group">
      <button
        type="button"
        onClick={onPin}
        title={view.pinned ? t('views.unpin', 'Unpin') : t('views.pin', 'Pin')}
        className={`text-lg ${view.pinned ? 'text-vedicGold' : 'text-vedicMaroon/30 hover:text-vedicGold'}`}
        aria-label={view.pinned ? t('views.unpinView', 'Unpin view') : t('views.pinView', 'Pin view')}
      >
        {view.pinned ? '★' : '☆'}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex-1 text-left min-w-0"
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') { setEditing(false); setDraft(view.name); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-1.5 py-0.5 rounded border border-vedicGold/50 text-sm"
          />
        ) : (
          /* TODO(i18n-server): localize view.name (user-supplied) */
          <div className="text-sm font-semibold text-vedicMaroon truncate" lang="en">{view.name}</div>
        )}
        <div className="flex items-center gap-2 text-[11px] text-vedicMaroon/60 mt-0.5 truncate">
          <span className="font-mono">{view.route}</span>
          {view.kind && view.kind !== 'generic' && <Pill tone="info">{view.kind}</Pill>}
          {view.updatedAt && <span>· {new Date(view.updatedAt).toLocaleDateString()}</span>}
        </div>
        {view.tags && view.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {view.tags.map((tag) => (
              /* TODO(i18n-server): localize view.tags (user-supplied) */
              <span key={tag} lang="en" className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-vedicGold/15 text-vedicMaroon/70">
                {tag}
              </span>
            ))}
          </div>
        )}
      </button>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => { setDraft(view.name); setEditing(true); }}
          title={t('views.rename', 'Rename')}
          className="p-1.5 rounded text-vedicMaroon/60 hover:text-vedicMaroon hover:bg-vedicGold/20"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={onDelete}
          title={t('views.delete', 'Delete')}
          className="p-1.5 rounded text-red-700/70 hover:text-red-700 hover:bg-red-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
