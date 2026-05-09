// Personal knowledge base — chart library with events, predictions, notes.
//
// Two panes:
//   Left  — chart list with relationship filter + "Add chart" form
//   Right — detail view of the selected chart (tabs: Events / Predictions / Notes)

import { useEffect, useState } from 'react';
import { Card, PageShell, Pill, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import { CityAutocomplete } from '../components/forms/CityAutocomplete';

const RELATIONSHIPS = ['self','spouse','parent','child','sibling','family','friend','colleague','client','celebrity','other'] as const;
type Rel = typeof RELATIONSHIPS[number];

const EVENT_CATEGORIES = ['career','health','relationship','family','money','education','travel','loss','milestone','other'];
const PRED_CATEGORIES = ['career','health','relationship','marriage','money','travel','other'];

export function LibraryPage() {
  const { t } = useT();
  const [list, setList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chart, setChart] = useState<any | null>(null);
  const [filter, setFilter] = useState<Rel | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'events' | 'predictions' | 'notes'>('events');

  async function refreshList() {
    try {
      const r = await api.libraryList(filter || undefined);
      setList(r.charts);
    } catch (e) { setError((e as Error).message); }
  }
  async function loadChart(id: string) {
    setSelectedId(id);
    try {
      const r = await api.libraryGet(id);
      setChart(r.chart);
    } catch (e) { setError((e as Error).message); }
  }
  useEffect(() => { refreshList(); }, [filter]);

  return (
    <PageShell title={t('library.title', 'Chart Library')} subtitle={t('library.subtitle', 'Your people, their charts, life events, predictions, and notes — all in one place.')}>
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* ── LEFT: list + add form ─────────────────────────────────────── */}
        <aside className="space-y-4">
          <AddChartForm onCreated={() => refreshList()} onError={setError} />
          <Card title={t('library.saved', 'Saved charts')}>
            <div className="mb-3">
              <select value={filter} onChange={(e) => setFilter(e.target.value as Rel | '')}
                className="w-full rounded border border-vedicGold/40 px-2 py-1 text-sm bg-white">
                <option value="">{t('library.allRelations', 'All relationships')}</option>
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{t(`library.rel.${r}`, r)}</option>)}
              </select>
            </div>
            {list.length === 0 && <p className="text-xs text-vedicMaroon/60 italic">{t('library.nothingSaved', 'Nothing saved yet. Add your own chart above.')}</p>}
            <ul className="space-y-1">
              {list.map((c) => (
                <li key={c._id}>
                  <button onClick={() => loadChart(c._id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm border transition-colors ${
                      selectedId === c._id
                        ? 'bg-vedicMaroon text-white border-vedicMaroon'
                        : 'bg-white text-vedicMaroon border-vedicGold/30 hover:bg-parchment'
                    }`}>
                    <div className="font-semibold">{c.label}</div>
                    <div className="text-[11px] opacity-80 flex gap-2 mt-0.5">
                      <span>{t(`library.rel.${c.relationship}`, c.relationship)}</span>
                      <span>• {new Date(c.datetime).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[10px] opacity-60 mt-1">
                      {c.eventCount} {t('library.eventsLabel', 'events')} · {c.predictionCount} {t('library.predictionsLabel', 'predictions')} · {c.noteCount} {t('library.notesLabel', 'notes')}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        {/* ── RIGHT: chart detail ───────────────────────────────────────── */}
        <main className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!chart && <EmptyState>{t('library.empty', 'Select a chart on the left or add a new one.')}</EmptyState>}
          {chart && (
            <>
              <Card
                title={`${chart.label} · ${t(`library.rel.${chart.relationship}`, chart.relationship)}`}
                action={
                  <div className="flex gap-1 text-[11px]">
                    {(['events','predictions','notes'] as const).map((tabKey) => (
                      <button key={tabKey} onClick={() => setTab(tabKey)}
                        className={`px-2 py-1 rounded border ${tab === tabKey
                          ? 'bg-vedicMaroon text-white border-vedicMaroon'
                          : 'bg-white text-vedicMaroon border-vedicGold/40 hover:bg-parchment'}`}>
                        {t(`library.tab.${tabKey}`, tabKey)}
                      </button>
                    ))}
                  </div>
                }>
                <div className="text-xs text-vedicMaroon/70 flex gap-4 flex-wrap">
                  <span>{t('library.bornLabel', 'Born')}: <strong className="text-vedicMaroon">{new Date(chart.datetime).toLocaleString()}</strong></span>
                  <span>{t('library.placeLabel', 'Place')}: {chart.placeName ?? '—'}</span>
                  <span>{t('library.latLng', 'Lat/Lng')}: {chart.lat.toFixed(3)}, {chart.lng.toFixed(3)}</span>
                </div>
              </Card>

              {tab === 'events' && <EventsTab chart={chart} onChange={() => loadChart(chart._id)} />}
              {tab === 'predictions' && <PredictionsTab chart={chart} onChange={() => loadChart(chart._id)} />}
              {tab === 'notes' && <NotesTab chart={chart} onChange={() => loadChart(chart._id)} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

// ─── Add-chart form ─────────────────────────────────────────────────────────
function AddChartForm({ onCreated, onError }: { onCreated: () => void; onError: (m: string) => void }) {
  const { t } = useT();
  const [label, setLabel] = useState('');
  const [rel, setRel] = useState<Rel>('friend');
  const [datetime, setDatetime] = useState('');
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');
  const [tz, setTz] = useState<number | ''>('');
  const [place, setPlace] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label || !datetime || lat === '' || lng === '') return;
    try {
      await api.libraryCreate({
        label, relationship: rel,
        datetime: new Date(datetime).toISOString(),
        lat: Number(lat), lng: Number(lng),
        tzOffsetHours: tz === '' ? undefined : Number(tz),
        placeName: place || undefined,
      });
      setLabel(''); setDatetime(''); setLat(''); setLng(''); setTz(''); setPlace('');
      onCreated();
    } catch (e) { onError((e as Error).message); }
  }

  return (
    <Card title={t('library.addChart', 'Add chart')}>
      <form onSubmit={submit} className="space-y-2 text-xs">
        <input placeholder={t('library.labelPlaceholder', 'Name / label')} value={label} onChange={(e) => setLabel(e.target.value)}
          className="input" required />
        <select value={rel} onChange={(e) => setRel(e.target.value as Rel)} className="input">
          {RELATIONSHIPS.map((r) => <option key={r} value={r}>{t(`library.rel.${r}`, r)}</option>)}
        </select>
        <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)}
          className="input" required />
        <CityAutocomplete
          value={place}
          onChange={setPlace}
          onCitySelect={(c) => { setPlace(`${c.name}, ${c.admin}`); setLat(c.lat); setLng(c.lng); setTz(c.tz); }}
          placeholder={t('library.cityPlaceholder', 'Type a city — Delhi, Mumbai, New York…')}
        />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" step="0.0001" placeholder={t('form.lat', 'Latitude')} value={lat}
            onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))}
            className="input tabular-nums" required />
          <input type="number" step="0.0001" placeholder={t('form.lng', 'Longitude')} value={lng}
            onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))}
            className="input tabular-nums" required />
          <input type="number" step="0.25" placeholder={t('form.tz', 'TZ offset')} value={tz}
            onChange={(e) => setTz(e.target.value === '' ? '' : Number(e.target.value))}
            className="input tabular-nums" />
        </div>
        <button type="submit" className="btn btn-accent w-full" style={{ padding: '8px 14px' }}>
          {t('library.saveBtn', 'Save chart')}
        </button>
      </form>
    </Card>
  );
}

// ─── Events tab ─────────────────────────────────────────────────────────────
function EventsTab({ chart, onChange }: { chart: any; onChange: () => void }) {
  const { t } = useT();
  const [date, setDate] = useState('');
  const [cat, setCat] = useState(EVENT_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !title) return;
    await api.libraryAddEvent(chart._id, { date: new Date(date).toISOString(), category: cat, title, notes });
    setDate(''); setTitle(''); setNotes('');
    onChange();
  }
  async function del(eventId: string) {
    await api.libraryDeleteEvent(chart._id, eventId);
    onChange();
  }

  const events = [...(chart.lifeEvents ?? [])].sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card title={t('library.lifeEventsHeader', 'Life events — {n}').replace('{n}', String(events.length))}>
      <form onSubmit={add} className="grid md:grid-cols-4 gap-2 mb-4 text-xs">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm" required />
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm bg-white">
          {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{t(`library.cat.${c}`, c)}</option>)}
        </select>
        <input placeholder={t('library.eventTitle', 'Title')} value={title} onChange={(e) => setTitle(e.target.value)}
          className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm md:col-span-2" required />
        <textarea placeholder={t('library.eventNotes', 'Notes (optional)')} value={notes} onChange={(e) => setNotes(e.target.value)}
          className="md:col-span-3 rounded border border-vedicGold/40 px-2 py-1.5 text-sm" rows={1} />
        <button type="submit"
          className="rounded bg-saffron hover:bg-deepSaffron text-white text-sm font-semibold">{t('library.addEvent', 'Add event')}</button>
      </form>

      {events.length === 0 && <p className="text-xs text-vedicMaroon/60 italic">{t('library.eventsEmpty', 'No events yet — log past milestones and the app will show you which dasha + transit was active.')}</p>}

      <ul className="space-y-2">
        {events.map((e: any) => (
          <li key={e._id} className="border border-vedicGold/30 rounded p-3 bg-parchment/40">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-vedicMaroon">{e.title}</span>
                  <Pill tone="neutral">{t(`library.cat.${e.category}`, e.category)}</Pill>
                  <span className="text-[11px] text-vedicMaroon/60">
                    {new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {e.snapshot && (
                  <div className="text-[11px] text-vedicMaroon/70 mt-1">
                    {/* TODO(i18n-server): localize snapshot maha/antar/pratyantar/transitSummary strings */}
                    {e.snapshot.maha && <>{t('library.maha', 'Maha')} <strong lang="en">{e.snapshot.maha}</strong></>}
                    {e.snapshot.antar && <> · {t('library.antar', 'Antar')} <strong lang="en">{e.snapshot.antar}</strong></>}
                    {e.snapshot.pratyantar && <> · {t('library.pratyantar', 'Pratyantar')} <strong lang="en">{e.snapshot.pratyantar}</strong></>}
                    {e.snapshot.transitSummary && <> · <span lang="en">{e.snapshot.transitSummary}</span></>}
                  </div>
                )}
                {e.notes && <div className="text-xs text-vedicMaroon/80 mt-1">{e.notes}</div>}
              </div>
              <button onClick={() => del(e._id)} className="text-[11px] text-red-700 hover:underline">{t('library.delete', 'delete')}</button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ─── Predictions tab ────────────────────────────────────────────────────────
function PredictionsTab({ chart, onChange }: { chart: any; onChange: () => void }) {
  const { t } = useT();
  const [forDate, setForDate] = useState('');
  const [forEnd, setForEnd] = useState('');
  const [cat, setCat] = useState(PRED_CATEGORIES[0]);
  const [text, setText] = useState('');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text) return;
    await api.libraryAddPrediction(chart._id, {
      forDate: forDate ? new Date(forDate).toISOString() : undefined,
      forDateEnd: forEnd ? new Date(forEnd).toISOString() : undefined,
      category: cat, text,
    });
    setForDate(''); setForEnd(''); setText('');
    onChange();
  }
  async function setOutcome(predId: string, outcome: string) {
    await api.libraryUpdatePrediction(chart._id, predId, { outcome });
    onChange();
  }
  async function del(predId: string) {
    await api.libraryDeletePrediction(chart._id, predId);
    onChange();
  }

  const preds = chart.predictions ?? [];
  const hits = preds.filter((p: any) => p.outcome === 'hit').length;
  const misses = preds.filter((p: any) => p.outcome === 'miss').length;
  const total = hits + misses;
  const accuracy = total > 0 ? Math.round((hits / total) * 100) : null;
  const headerTitle = accuracy != null
    ? t('library.predsHeaderAcc', 'Predictions — {n} · {pct}% accuracy ({hits}/{total} scored)')
        .replace('{n}', String(preds.length))
        .replace('{pct}', String(accuracy))
        .replace('{hits}', String(hits))
        .replace('{total}', String(total))
    : t('library.predsHeader', 'Predictions — {n}').replace('{n}', String(preds.length));

  return (
    <Card title={headerTitle}>
      <form onSubmit={add} className="grid md:grid-cols-4 gap-2 mb-4 text-xs">
        <input type="date" value={forDate} onChange={(e) => setForDate(e.target.value)} placeholder={t('library.predForDate', 'For date')}
          className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm" />
        <input type="date" value={forEnd} onChange={(e) => setForEnd(e.target.value)} placeholder={t('library.predRangeEnd', 'Range end (optional)')}
          className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm" />
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm bg-white">
          {PRED_CATEGORIES.map((c) => <option key={c} value={c}>{t(`library.cat.${c}`, c)}</option>)}
        </select>
        <button type="submit"
          className="rounded bg-saffron hover:bg-deepSaffron text-white text-sm font-semibold">{t('library.logPrediction', 'Log prediction')}</button>
        <textarea placeholder={t('library.predText', 'Prediction text')} value={text} onChange={(e) => setText(e.target.value)}
          className="md:col-span-4 rounded border border-vedicGold/40 px-2 py-1.5 text-sm" rows={2} required />
      </form>

      {preds.length === 0 && <p className="text-xs text-vedicMaroon/60 italic">{t('library.predsEmpty', 'Track which predictions hit and which miss — calibrates which techniques work for you.')}</p>}

      <ul className="space-y-2">
        {preds.map((p: any) => {
          const tone = p.outcome === 'hit' ? 'good' : p.outcome === 'miss' ? 'bad' : p.outcome === 'partial' ? 'warn' : 'neutral';
          return (
            <li key={p._id} className="border border-vedicGold/30 rounded p-3 bg-parchment/40">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill tone={tone}>{t(`library.outcome.${p.outcome}`, p.outcome)}</Pill>
                    <Pill tone="neutral">{t(`library.cat.${p.category}`, p.category)}</Pill>
                    {p.forDate && <span className="text-[11px] text-vedicMaroon/60">
                      {t('library.target', 'target')} {new Date(p.forDate).toLocaleDateString()}
                      {p.forDateEnd && ` → ${new Date(p.forDateEnd).toLocaleDateString()}`}
                    </span>}
                  </div>
                  <div className="text-sm text-vedicMaroon/90 mt-1">{p.text}</div>
                  <div className="flex gap-2 mt-2 text-[11px]">
                    {['hit','partial','miss','pending'].map((o) => (
                      <button key={o} onClick={() => setOutcome(p._id, o)}
                        className={`px-2 py-0.5 rounded border ${p.outcome === o
                          ? 'bg-vedicMaroon text-white border-vedicMaroon'
                          : 'bg-white border-vedicGold/40 hover:bg-parchment'}`}>
                        {t(`library.outcome.${o}`, o)}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => del(p._id)} className="text-[11px] text-red-700 hover:underline">{t('library.delete', 'delete')}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ─── Notes tab ──────────────────────────────────────────────────────────────
function NotesTab({ chart, onChange }: { chart: any; onChange: () => void }) {
  const { t, al } = useT();
  const [scope, setScope] = useState<'chart' | 'planet' | 'house'>('chart');
  const [target, setTarget] = useState('');
  const [md, setMd] = useState('');

  const existing = (chart.notes ?? []).find((n: any) =>
    n.scope === scope && (n.target ?? null) === (target || null));

  useEffect(() => { setMd(existing?.markdown ?? ''); }, [existing?._id, scope, target]);

  async function save() {
    await api.librarySaveNote(chart._id, {
      scope, target: target || undefined, markdown: md,
    });
    onChange();
  }

  const allNotes = chart.notes ?? [];

  return (
    <Card title={t('library.notesHeader', 'Notes — {n}').replace('{n}', String(allNotes.length))}>
      <div className="grid md:grid-cols-[160px_160px_1fr] gap-2 mb-3 text-xs items-start">
        <select value={scope} onChange={(e) => setScope(e.target.value as any)}
          className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm bg-white">
          <option value="chart">{t('library.notes.scopeChart', 'Chart-wide')}</option>
          <option value="planet">{t('library.notes.scopePlanet', 'Per planet')}</option>
          <option value="house">{t('library.notes.scopeHouse', 'Per house')}</option>
        </select>
        {scope === 'planet' && (
          <select value={target} onChange={(e) => setTarget(e.target.value)}
            className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm bg-white">
            <option value="">{t('library.pickPlanet', 'Pick planet')}</option>
            {['SU','MO','MA','ME','JU','VE','SA','RA','KE'].map((p) => <option key={p} value={p}>{al.planet(p)}</option>)}
          </select>
        )}
        {scope === 'house' && (
          <select value={target} onChange={(e) => setTarget(e.target.value)}
            className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm bg-white">
            <option value="">{t('library.pickHouse', 'Pick house')}</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={String(h)}>{h}</option>)}
          </select>
        )}
        {scope === 'chart' && <div />}
        <div className="flex flex-col gap-2">
          <textarea value={md} onChange={(e) => setMd(e.target.value)} rows={8}
            placeholder={t('library.noteScope', 'Markdown notes about this chart / planet / house')}
            className="rounded border border-vedicGold/40 px-2 py-1.5 text-sm font-mono" />
          <button onClick={save}
            className="self-start rounded bg-saffron hover:bg-deepSaffron text-white px-4 py-1.5 text-sm font-semibold">
            {t('library.saveNote', 'Save note')}
          </button>
        </div>
      </div>

      <div className="pt-3 border-t border-vedicGold/30">
        <h4 className="text-vedicMaroon font-semibold uppercase text-[10px] tracking-wider mb-2">
          {t('library.allNotesHeading', 'All notes for this chart ({n})').replace('{n}', String(allNotes.length))}
        </h4>
        {allNotes.length === 0 && <p className="text-xs text-vedicMaroon/60 italic">{t('library.notesEmpty', 'Build up your reading over years — start with one observation.')}</p>}
        <ul className="space-y-2 text-xs">
          {allNotes.map((n: any) => (
            <li key={n._id} className="border border-vedicGold/20 rounded p-2 bg-white/60">
              <div className="flex items-center gap-2 text-[11px] text-vedicMaroon/60">
                <Pill tone="neutral">{n.scope}{n.target ? ` · ${n.target}` : ''}</Pill>
                <span>{new Date(n.updatedAt).toLocaleString()}</span>
              </div>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] text-vedicMaroon/90">{n.markdown}</pre>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
