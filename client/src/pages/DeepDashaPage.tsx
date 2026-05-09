import { useEffect, useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, Pill, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type {
  BirthInput, DashaLevel, DashaPeriod, DeepDashaSnapshot,
  DashaSystemKey, DashaSystemMeta, DashaStartInfo,
} from '../types';

const LEVELS: DashaLevel[] = ['maha', 'antar', 'pratyantar', 'sookshma', 'prana', 'deha'];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function useFmtDuration() {
  const { t } = useT();
  return (years: number): string => {
    if (years >= 1) return `${years.toFixed(2)} ${t('dasha.fmt.yrs', 'yrs')}`;
    const days = years * 365.25;
    if (days >= 1) return `${days.toFixed(1)} ${t('dasha.fmt.days', 'days')}`;
    const hours = days * 24;
    if (hours >= 1) return `${hours.toFixed(1)} ${t('dasha.fmt.hrs', 'hrs')}`;
    return `${(hours * 60).toFixed(0)} ${t('dasha.fmt.min', 'min')}`;
  };
}

function progressPct(p: DashaPeriod, at: Date): number {
  const s = new Date(p.start).getTime();
  const e = new Date(p.end).getTime();
  const t = at.getTime();
  if (t <= s) return 0;
  if (t >= e) return 100;
  return ((t - s) / (e - s)) * 100;
}

function LevelRow({
  period, level, at,
}: { period: DashaPeriod | null; level: DashaLevel; at: Date }) {
  const { t, al } = useT();
  const fmtDuration = useFmtDuration();
  if (!period) {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-vedicGold/10 opacity-40">
        <div className="w-24 text-[11px] uppercase text-vedicMaroon/60">{t(`dasha.level.${level}`, level)}</div>
        <div className="flex-1 text-xs italic">{t('dasha.outOfRange', '— out of range —')}</div>
      </div>
    );
  }
  const pct = progressPct(period, at);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-vedicGold/10">
      <div className="w-28">
        <div className="text-[10px] uppercase text-vedicMaroon/60">{t(`dasha.level.${level}`, level)}</div>
        <div className="text-[10px] text-vedicMaroon/40">{t(`dasha.desc.${level}`, level)}</div>
      </div>
      <div className="w-16">
        <Pill tone="info">{al.planetShort(period.lord)}</Pill>
      </div>
      <div className="w-36 text-sm font-semibold text-vedicMaroon">
        {al.planet(period.lord)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-vedicGold/20 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: 'var(--vedic-maroon, #7c2d12)' }}
          />
        </div>
        <div className="mt-1 text-[10px] text-vedicMaroon/50 flex justify-between tabular-nums">
          <span>{fmtDate(period.start)}</span>
          <span>{pct.toFixed(1)}{t('dasha.elapsedShort', '% elapsed')}</span>
          <span>{fmtDate(period.end)}</span>
        </div>
      </div>
      <div className="w-24 text-right text-[11px] text-vedicMaroon/70 tabular-nums">
        {fmtDuration(period.years)}
      </div>
    </div>
  );
}

// ── Drill-down tree node ──────────────────────────────────────────────────
interface TreeNodeProps {
  period: DashaPeriod;
  path: number[];
  depth: number;
  birth: BirthInput;
  activeLords: (string | null)[];
  now: Date;
  system: DashaSystemKey;
}

function TreeNode({ period, path, depth, birth, activeLords, now, system }: TreeNodeProps) {
  const { t, al } = useT();
  const fmtDuration = useFmtDuration();
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<DashaPeriod[] | null>(null);
  const [loading, setLoading] = useState(false);
  const canExpand = LEVELS.indexOf(period.level) < LEVELS.length - 1;
  const isActive = activeLords[depth] === period.lord
    && new Date(period.start).getTime() <= now.getTime()
    && now.getTime() < new Date(period.end).getTime();

  async function toggle() {
    if (!canExpand) return;
    if (expanded) { setExpanded(false); return; }
    if (!children) {
      setLoading(true);
      try {
        const r = await api.subdivideDasha(birth, path, system);
        setChildren(r.children);
      } finally { setLoading(false); }
    }
    setExpanded(true);
  }

  const pct = progressPct(period, now);
  const label = `${al.planetShort(period.lord)} ${al.planet(period.lord)}`;

  return (
    <div>
      <button
        onClick={toggle}
        disabled={!canExpand}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left
          transition-colors text-xs
          ${isActive ? 'bg-vedicGold/15 border border-vedicMaroon/40'
                     : 'hover:bg-vedicGold/5 border border-transparent'}
          ${!canExpand ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <span className={`w-4 text-center text-vedicMaroon/60 ${canExpand ? '' : 'invisible'}`}>
          {expanded ? '▾' : '▸'}
        </span>
        <span className="w-24 font-semibold text-vedicMaroon tabular-nums">
          {label}
        </span>
        <span className="w-20 text-[10px] uppercase text-vedicMaroon/60">{t(`dasha.short.${period.level}`, period.level)}</span>
        <span className="flex-1 text-[11px] text-vedicMaroon/70 tabular-nums">
          {fmtDate(period.start)} → {fmtDate(period.end)}
        </span>
        <span className="w-20 text-right text-[10px] text-vedicMaroon/60 tabular-nums">
          {fmtDuration(period.years)}
        </span>
        <span className="w-14 text-right text-[10px] tabular-nums">
          {isActive && (
            <span className="text-emerald-700 font-semibold">{t('dasha.now', '• now {pct}%').replace('{pct}', pct.toFixed(0))}</span>
          )}
        </span>
      </button>
      {expanded && (
        <div className="ml-4 border-l border-vedicGold/30 pl-2 mt-1">
          {loading && <div className="text-[11px] text-vedicMaroon/50 italic py-1">{t('common.loading', 'Loading…')}</div>}
          {children?.map((c, i) => (
            <TreeNode
              key={`${c.level}-${c.start}-${i}`}
              period={c}
              path={[...path, i]}
              depth={depth + 1}
              birth={birth}
              activeLords={activeLords}
              now={now}
              system={system}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DeepDashaPage() {
  const { t, al } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [atInput, setAtInput] = useState<string>(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [system, setSystem] = useState<DashaSystemKey>('vimshottari');
  const [systems, setSystems] = useState<DashaSystemMeta[]>([]);
  const [snapshot, setSnapshot] = useState<DeepDashaSnapshot | null>(null);
  const [startInfo, setStartInfo] = useState<DashaStartInfo | null>(null);
  const [activeMeta, setActiveMeta] = useState<DashaSystemMeta | null>(null);
  const [mahadashas, setMahadashas] = useState<DashaPeriod[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atDate = useMemo(() => new Date(atInput), [atInput]);

  useEffect(() => {
    api.dashaSystems()
      .then((r) => setSystems(r.systems))
      .catch((e) => setError((e as Error).message));
  }, []);

  async function computeAll(b: BirthInput, sys: DashaSystemKey, atISO?: string) {
    setLoading(true); setError(null);
    try {
      const iso = atISO ? new Date(atISO).toISOString() : new Date(atInput).toISOString();
      const [deep, root] = await Promise.all([
        api.deepDasha(b, iso, sys),
        api.subdivideDasha(b, [], sys),
      ]);
      setSnapshot(deep.deep);
      setStartInfo(deep.start);
      setActiveMeta(deep.system);
      setMahadashas(root.children);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  // Recompute snapshot when atInput or system changes (birth already set)
  useEffect(() => {
    if (!birth) return;
    const iso = new Date(atInput).toISOString();
    api.deepDasha(birth, iso, system)
      .then((r) => { setSnapshot(r.deep); setStartInfo(r.start); setActiveMeta(r.system); })
      .catch((e) => setError((e as Error).message));
  }, [atInput, birth, system]);

  // Reload tree root when system changes
  useEffect(() => {
    if (!birth) return;
    api.subdivideDasha(birth, [], system)
      .then((r) => setMahadashas(r.children))
      .catch((e) => setError((e as Error).message));
  }, [birth, system]);

  const activeLords = useMemo(() => {
    if (!snapshot) return [];
    return [
      snapshot.maha?.lord ?? null,
      snapshot.antar?.lord ?? null,
      snapshot.pratyantar?.lord ?? null,
      snapshot.sookshma?.lord ?? null,
      snapshot.prana?.lord ?? null,
      snapshot.deha?.lord ?? null,
    ];
  }, [snapshot]);

  function setToNow() {
    const d = new Date(); d.setSeconds(0, 0);
    setAtInput(d.toISOString().slice(0, 16));
  }

  return (
    <PageShell
      title={t('dasha.title', 'Dasha Systems')}
      subtitle={t('dasha.subtitle', 'Vimshottari · Yogini · Ashtottari — deep 6-level drill-down, switch systems instantly')}
    >
      <div className="mb-6">
        <BirthDetailsForm
          onSubmit={(b) => { setBirth(b); computeAll(b, system); }}
        />
        {birth && <p className="text-[11px] text-emerald-700 mt-2">{t('dasha.captured', '✓ Birth details captured')}</p>}
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {loading && <EmptyState>{t('dasha.computing', 'Computing dasha sequence…')}</EmptyState>}
      {!snapshot && !loading && !error && (
        <EmptyState>{t('dasha.empty', 'Submit birth details to explore dashas across all three systems.')}</EmptyState>
      )}

      {snapshot && (
        <div className="space-y-6">
          {/* ── SYSTEM PICKER ─────────────────────────────────────────── */}
          <Card title={t('dasha.systemTitle', 'Dasha system')}>
            <div className="flex flex-wrap gap-2 mb-3">
              {systems.map((s) => {
                const isActive = s.key === system;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSystem(s.key)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors
                      ${isActive ? 'text-white border-transparent'
                                 : 'text-vedicMaroon bg-white/60 border-vedicGold/40 hover:bg-vedicGold/10'}`}
                    style={isActive ? { background: 'var(--vedic-maroon, #7c2d12)' } : {}}
                  >
                    {/* TODO(i18n-server): localize DashaSystemMeta.name */}
                    <div className="text-sm" lang="en">{s.name}</div>
                    <div className="text-[10px] opacity-80 font-normal">
                      {t('dasha.yearsShort', '{n}y').replace('{n}', String(s.totalYears))} · {t('dasha.lordsCount', '{n} lords').replace('{n}', String(s.order.length))}
                    </div>
                  </button>
                );
              })}
            </div>
            {activeMeta && (
              <div className="text-[11px] text-vedicMaroon/70 space-y-1">
                {/* TODO(i18n-server): localize DashaSystemMeta.purpose / condition / note */}
                <p><span className="font-semibold" lang="en">{activeMeta.name} ({activeMeta.nameHi}):</span> <span lang="en">{activeMeta.purpose}</span></p>
                {activeMeta.condition && (
                  <p className="text-vedicMaroon/50"><em>{t('dasha.applicability', 'Applicability')}:</em> <span lang="en">{activeMeta.condition}</span></p>
                )}
                {startInfo && (
                  <p className="pt-1">
                    {t('dasha.startingLord', 'Starting lord at birth')}:{' '}
                    <span className="font-semibold text-vedicMaroon">
                      {al.planet(startInfo.startingLord)}
                    </span>{' '}
                    · {t('dasha.balance', 'balance')}{' '}
                    <span className="font-semibold text-vedicMaroon">
                      {t('dasha.balanceYrs', '{n} yrs').replace('{n}', startInfo.balanceYears.toFixed(2))}
                    </span>{' '}
                    {t('dasha.elapsedNote', '({pct}% of that lord\'s period had elapsed before birth)').replace('{pct}', (startInfo.elapsedFraction * 100).toFixed(1))}
                    {startInfo.note && <span className="text-vedicMaroon/50" lang="en"> — {startInfo.note}</span>}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* ── AT-MOMENT CONTROL ────────────────────────────────────── */}
          <Card title={t('dasha.momentTitle', 'Moment to inspect')}>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="datetime-local"
                value={atInput}
                onChange={(e) => setAtInput(e.target.value)}
                className="px-3 py-2 rounded-lg border border-vedicGold/40 bg-white/60 text-sm"
              />
              <button
                onClick={setToNow}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-vedicGold/40
                  bg-white/60 text-vedicMaroon hover:bg-vedicGold/10"
              >
                {t('dasha.setToNow', 'Set to now')}
              </button>
              <p className="text-[11px] text-vedicMaroon/60">
                {t('dasha.momentDesc', 'Change this to see the active 6-level dasha at any past or future moment.')}
              </p>
            </div>
          </Card>

          {/* ── 6-LEVEL SNAPSHOT ─────────────────────────────────────── */}
          <Card title={t('dasha.activePeriods', 'Active periods — {name}').replace('{name}', activeMeta?.name ?? '')}>
            <div>
              <LevelRow period={snapshot.maha} level="maha" at={atDate} />
              <LevelRow period={snapshot.antar} level="antar" at={atDate} />
              <LevelRow period={snapshot.pratyantar} level="pratyantar" at={atDate} />
              <LevelRow period={snapshot.sookshma} level="sookshma" at={atDate} />
              <LevelRow period={snapshot.prana} level="prana" at={atDate} />
              <LevelRow period={snapshot.deha} level="deha" at={atDate} />
            </div>
            {snapshot.deha && (
              <p className="mt-3 text-[11px] text-vedicMaroon/60">
                {t('dasha.signature', 'Signature for this moment')}:{' '}
                <span className="font-semibold text-vedicMaroon">
                  {[snapshot.maha, snapshot.antar, snapshot.pratyantar,
                    snapshot.sookshma, snapshot.prana, snapshot.deha]
                    .map((p) => p ? al.planet(p.lord) : null).filter(Boolean).join(' → ')}
                </span>
              </p>
            )}
          </Card>

          {/* ── DRILL-DOWN TREE ──────────────────────────────────────── */}
          {mahadashas && birth && (
            <Card title={t('dasha.fullTreeTitle', 'Full {name} tree (click to expand)').replace('{name}', activeMeta?.name ?? '')}>
              <div className="space-y-0.5">
                {mahadashas.map((m, i) => (
                  <TreeNode
                    key={`${system}-${m.lord}-${m.start}`}
                    period={m}
                    path={[i]}
                    depth={0}
                    birth={birth}
                    activeLords={activeLords}
                    now={atDate}
                    system={system}
                  />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-vedicMaroon/60">
                {t('dasha.treeNote', 'Highlighted rows show the active lineage at the inspected moment. Each click fetches the next level on demand.')}
              </p>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}
