// Phase 19 — Biometric (mostly zero) page.
//
// Five tabs:
//   1. Palmistry    — rule-based hand-reading (Hasta Samudrika + Cheiro)
//   2. Samudrika    — classical full-body physiognomy (32-lakshana)
//   3. Graphology   — handwriting → Big-Five traits
//   4. Numerology+  — Chaldean + Pythagorean side-by-side; pinnacles; karmic debt; masters
//   5. Tarot        — 78-card deck; 3-card / Celtic Cross / 12-house chart-overlay

import { useState } from 'react';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { VoiceInputButton, SaveViewButton } from '../components/ui/WorkflowAtoms';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput } from '../types';

type Tab = 'palmistry' | 'samudrika' | 'graphology' | 'numerology' | 'tarot';

type T = (key: string, fallback?: string) => string;

export function BiometricPage() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('palmistry');

  const tabLabels: Record<Tab, string> = {
    palmistry:  t('biometric.tab.palmistry', 'Palmistry'),
    samudrika:  t('biometric.tab.samudrika', 'Samudrika'),
    graphology: t('biometric.tab.graphology', 'Graphology'),
    numerology: t('biometric.tab.numerology', 'Numerology'),
    tarot:      t('biometric.tab.tarot', 'Tarot'),
  };

  return (
    <PageShell
      title={t('biometric.title', 'Biometric')}
      subtitle={t('biometric.subtitle', 'Palmistry · Samudrika · Graphology · Deep Numerology · Tarot — rule-based, local-only interpretation.')}
    >
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit mb-4">
        {(['palmistry', 'samudrika', 'graphology', 'numerology', 'tarot'] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === k ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
            }`}>
            {tabLabels[k]}
          </button>
        ))}
      </div>

      {tab === 'palmistry'  && <PalmistryTab  />}
      {tab === 'samudrika'  && <SamudrikaTab  />}
      {tab === 'graphology' && <GraphologyTab />}
      {tab === 'numerology' && <NumerologyTab />}
      {tab === 'tarot'      && <TarotTab      />}
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared primitives
// ═══════════════════════════════════════════════════════════════════════════

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wider text-vedicMaroon/70 mb-1">{children}</div>;
}

function Sel<TT extends string>({
  value, onChange, options, allowEmpty, render,
}: {
  value: TT | '';
  onChange: (v: TT | '') => void;
  options: readonly TT[];
  allowEmpty?: boolean;
  render?: (v: TT) => string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as TT | '')}
      className="w-full rounded-lg border border-vedicGold/40 px-2 py-1.5 text-sm bg-white">
      {allowEmpty && <option value="">—</option>}
      {options.map((o) => <option key={o} value={o}>{render ? render(o) : o}</option>)}
    </select>
  );
}

function SectionBlocks({ sections }: {
  sections: Array<{ id: string; heading: string; paragraphs: string[] }>;
}) {
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        // Section heading is now server-localized; inner paragraphs may
        // still contain English deep-content (deferred — flagged via lang="en")
        <Card key={s.id} title={s.heading}>
          <div className="space-y-2 text-sm text-vedicMaroon/90 leading-relaxed">
            {s.paragraphs.map((p, i) => <p key={i} lang="en">{p}</p>)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function SubmitBtn({ onClick, loading, label }: { onClick: () => void; loading: boolean; label?: string }) {
  const { t } = useT();
  return (
    <button onClick={onClick} disabled={loading}
      className="rounded-lg bg-saffron hover:bg-deepSaffron text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
      {loading ? t('biometric.btn.reading', 'Reading…') : (label ?? t('biometric.btn.read', 'Read'))}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Palmistry
// ═══════════════════════════════════════════════════════════════════════════

const HAND_SHAPES = ['earth', 'air', 'fire', 'water'] as const;
const THUMBS = ['flexible', 'firm', 'low-set', 'high-set'] as const;
const FINGER_LENGTHS = ['long', 'normal', 'short'] as const;
const LINE_QUALITIES = ['absent', 'faint', 'clear', 'deep', 'broken', 'chained', 'forked'] as const;
const MOUNT_SIZES = ['flat', 'normal', 'developed', 'over-developed'] as const;

function localizeShape(t: T, s: string): string { return t(`biometric.palm.shape.${s}`, s); }
function localizeThumb(t: T, s: string): string {
  const map: Record<string, string> = { 'flexible':'flexible', 'firm':'firm', 'low-set':'lowSet', 'high-set':'highSet' };
  return t(`biometric.palm.thumb.${map[s] ?? s}`, s);
}
function localizeFingerKey(t: T, s: string): string { return t(`biometric.palm.f.${s}`, s); }
function localizeLineKey(t: T, s: string): string { return t(`biometric.palm.line.${s}`, s); }
function localizeFingerLen(t: T, s: string): string { return t(`biometric.palm.fLen.${s}`, s); }
function localizeLineQ(t: T, s: string): string { return t(`biometric.palm.lq.${s}`, s); }
function localizeMountSize(t: T, s: string): string {
  const map: Record<string, string> = { 'flat':'flat', 'normal':'normal', 'developed':'developed', 'over-developed':'overDeveloped' };
  return t(`biometric.palm.mt.${map[s] ?? s}`, s);
}
function localizeHandSide(t: T, s: string): string { return t(`biometric.palm.${s}`, s); }

function PalmistryTab() {
  const { t } = useT();
  const [dominant, setDominant] = useState<'left' | 'right'>('right');
  const [shape, setShape] = useState<typeof HAND_SHAPES[number]>('air');
  const [thumb, setThumb] = useState<typeof THUMBS[number]>('flexible');
  const [fingers, setFingers] = useState<{ jupiter: string; saturn: string; apollo: string; mercury: string }>({
    jupiter: '', saturn: '', apollo: '', mercury: '',
  });
  const [lines, setLines] = useState<Record<string, string>>({
    life: 'clear', head: 'clear', heart: 'clear', fate: '', sun: '', mercury: '', marriage: '',
  });
  const [mounts, setMounts] = useState<Record<string, string>>({
    jupiter: '', saturn: '', apollo: '', mercury: '', venus: '', mars_lower: '', mars_upper: '', moon: '', rahu: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<any>(null);

  async function run() {
    setLoading(true); setError(null); setReading(null);
    try {
      const body = {
        dominantHand: dominant,
        handShape: shape,
        thumb,
        fingers: Object.fromEntries(Object.entries(fingers).filter(([, v]) => v)),
        lines:   Object.fromEntries(Object.entries(lines).filter(([, v]) => v)),
        mounts:  Object.fromEntries(Object.entries(mounts).filter(([, v]) => v)),
      };
      const r = await api.palmistry(body);
      setReading(r.reading);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      <aside className="space-y-4">
        <Card title={t('biometric.palm.hand', 'Hand')}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('biometric.palm.dominant', 'Dominant hand')}</Label>
              <Sel value={dominant} onChange={(v) => v && setDominant(v as any)} options={['left', 'right'] as const}
                render={(v) => localizeHandSide(t, v)} />
            </div>
            <div>
              <Label>{t('biometric.palm.shape', 'Hand shape')}</Label>
              <Sel value={shape} onChange={(v) => v && setShape(v as any)} options={HAND_SHAPES}
                render={(v) => localizeShape(t, v)} />
            </div>
            <div className="col-span-2">
              <Label>{t('biometric.palm.thumb', 'Thumb')}</Label>
              <Sel value={thumb} onChange={(v) => v && setThumb(v as any)} options={THUMBS}
                render={(v) => localizeThumb(t, v)} />
            </div>
          </div>
        </Card>
        <Card title={t('biometric.palm.fingers', 'Fingers (optional)')}>
          <div className="grid grid-cols-2 gap-3">
            {(['jupiter', 'saturn', 'apollo', 'mercury'] as const).map((f) => (
              <div key={f}>
                <Label>{localizeFingerKey(t, f)}</Label>
                <Sel value={fingers[f]} allowEmpty
                  onChange={(v) => setFingers((s) => ({ ...s, [f]: v }))}
                  options={FINGER_LENGTHS}
                  render={(v) => localizeFingerLen(t, v)} />
              </div>
            ))}
          </div>
        </Card>
        <Card title={t('biometric.palm.lines', 'Lines')}>
          <div className="grid grid-cols-2 gap-3">
            {(['life', 'head', 'heart', 'fate', 'sun', 'mercury', 'marriage'] as const).map((f) => (
              <div key={f}>
                <Label>{f === 'mercury' ? localizeFingerKey(t, 'mercury') : localizeLineKey(t, f)}</Label>
                <Sel value={lines[f] ?? ''} allowEmpty
                  onChange={(v) => setLines((s) => ({ ...s, [f]: v }))}
                  options={LINE_QUALITIES}
                  render={(v) => localizeLineQ(t, v)} />
              </div>
            ))}
          </div>
        </Card>
        <Card title={t('biometric.palm.mounts', 'Mounts (optional)')}>
          <div className="grid grid-cols-2 gap-3">
            {(['jupiter', 'saturn', 'apollo', 'mercury', 'venus', 'mars_lower', 'mars_upper', 'moon', 'rahu'] as const).map((f) => (
              <div key={f}>
                <Label>{localizeFingerKey(t, f)}</Label>
                <Sel value={mounts[f] ?? ''} allowEmpty
                  onChange={(v) => setMounts((s) => ({ ...s, [f]: v }))}
                  options={MOUNT_SIZES}
                  render={(v) => localizeMountSize(t, v)} />
              </div>
            ))}
          </div>
        </Card>
        <SubmitBtn onClick={run} loading={loading} label={t('biometric.btn.readPalm', 'Read palm')} />
      </aside>

      <section className="min-w-0">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!reading && !error && !loading && <EmptyState>{t('biometric.palm.empty', 'Pick hand features on the left, then Read.')}</EmptyState>}
        {reading && (
          <>
            <Card className="mb-4">
              <p className="text-sm text-vedicMaroon/90 italic leading-relaxed">{reading.summary}</p>
              {reading.highlights?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {/* highlight strings are short flags — kept English for readability */}
                  {reading.highlights.map((h: string, i: number) => (
                    <Pill key={i} tone="info"><span lang="en">{h}</span></Pill>
                  ))}
                </div>
              )}
            </Card>
            <SectionBlocks sections={reading.sections} />
            {reading.notes?.length > 0 && (
              <Card className="mt-4" title={t('biometric.palm.notes', 'Notes')}>
                <ul className="list-disc pl-5 text-xs text-vedicMaroon/70 space-y-1">
                  {reading.notes.map((n: string, i: number) => <li key={i}>{n}</li>)}
                </ul>
              </Card>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Samudrika
// ═══════════════════════════════════════════════════════════════════════════

const COMPLEXIONS = ['fair', 'golden', 'wheatish', 'dusky', 'dark'] as const;
const BUILDS = ['lean', 'medium', 'muscular', 'stocky'] as const;
const VOICES = ['melodious', 'resonant', 'soft', 'harsh', 'high-pitched'] as const;
const GAITS = ['elephant', 'swan', 'tiger', 'bull', 'peacock', 'horse'] as const;

function SamudrikaTab() {
  const { t } = useT();
  const [form, setForm] = useState<Record<string, string>>({
    complexion: 'wheatish', build: 'medium',
    height: 'medium', forehead: '', eyes: '', eyebrows: '', nose: '', lips: '',
    neck: '', shoulders: '', hands: '', feet: '', voice: '', gait: '', hair: '', naveldepth: '', laughter: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<any>(null);

  function set(k: string, v: string) { setForm((s) => ({ ...s, [k]: v })); }

  async function run() {
    setLoading(true); setError(null); setReading(null);
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v));
      const r = await api.samudrika(body);
      setReading(r.reading);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  const fields: Array<[string, readonly string[], boolean?]> = [
    ['complexion', COMPLEXIONS],
    ['build',      BUILDS],
    ['height',     ['short', 'medium', 'tall'], true],
    ['forehead',   ['broad', 'medium', 'narrow'], true],
    ['eyes',       ['lotus', 'deep-set', 'large', 'almond', 'small'], true],
    ['eyebrows',   ['arched', 'straight', 'thick', 'joined'], true],
    ['nose',       ['straight', 'aquiline', 'upturned', 'flat', 'long'], true],
    ['lips',       ['thin', 'medium', 'full'], true],
    ['neck',       ['short', 'long', 'conch-like'], true],
    ['shoulders',  ['broad', 'medium', 'narrow', 'drooping'], true],
    ['hands',      ['long', 'short', 'soft', 'firm'], true],
    ['feet',       ['soft-rosy', 'firm', 'cracked', 'flat'], true],
    ['voice',      VOICES, true],
    ['gait',       GAITS, true],
    ['hair',       ['straight', 'wavy', 'curly', 'thick', 'thin'], true],
    ['naveldepth', ['deep', 'shallow'], true],
    ['laughter',   ['restrained', 'hearty', 'shrill'], true],
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      <aside className="space-y-4">
        <Card title={t('biometric.sam.body', 'Body, face & presence')}>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([k, opts, optional]) => (
              <div key={k}>
                <Label>{t(`biometric.sam.f.${k}`, k)}</Label>
                <Sel
                  value={form[k] ?? ''}
                  allowEmpty={optional}
                  onChange={(v) => set(k, v)}
                  options={opts as readonly string[]}
                />
              </div>
            ))}
          </div>
        </Card>
        <SubmitBtn onClick={run} loading={loading} label={t('biometric.btn.readBody', 'Read physiognomy')} />
      </aside>

      <section className="min-w-0">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!reading && !error && !loading && <EmptyState>{t('biometric.sam.empty', 'Complexion + build are required; rest are optional.')}</EmptyState>}
        {reading && (
          <>
            <Card className="mb-4">
              <div className="text-xs uppercase tracking-wider text-vedicMaroon/60">{t('biometric.sam.constitution', 'Constitution')}</div>
              {/* bodyType is composed from English flags + locale-agnostic build/complexion strings */}
              <div className="text-base font-semibold text-vedicMaroon mb-2" lang="en">{reading.bodyType}</div>
              <p className="text-sm text-vedicMaroon/90 italic leading-relaxed">{reading.summary}</p>
              {(reading.auspicious?.length > 0 || reading.inauspicious?.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {/* auspicious/inauspicious flags use functional English keys (key:value pairs) */}
                  {reading.auspicious?.map((x: string, i: number) => (
                    <Pill key={`a${i}`} tone="good"><span lang="en">✓ {x}</span></Pill>
                  ))}
                  {reading.inauspicious?.map((x: string, i: number) => (
                    <Pill key={`n${i}`} tone="warn"><span lang="en">! {x}</span></Pill>
                  ))}
                </div>
              )}
            </Card>
            <SectionBlocks sections={reading.sections} />
            {reading.notes?.length > 0 && (
              <Card className="mt-4" title={t('biometric.sam.notes', 'Notes')}>
                <ul className="list-disc pl-5 text-xs text-vedicMaroon/70 space-y-1">
                  {/* first note now server-localized; subsequent notes deferred */}
                  {reading.notes.map((n: string, i: number) => <li key={i} lang={i === 0 ? undefined : 'en'}>{n}</li>)}
                </ul>
              </Card>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Graphology
// ═══════════════════════════════════════════════════════════════════════════

const SLANTS = ['left', 'vertical', 'right', 'variable'] as const;
const PRESSURES = ['light', 'medium', 'heavy', 'variable'] as const;
const SIZES = ['small', 'medium', 'large'] as const;
const SPACINGS = ['tight', 'even', 'wide'] as const;
const BASELINES = ['rising', 'level', 'falling', 'wavy'] as const;
const LOOPS = ['absent', 'narrow', 'rounded', 'exaggerated'] as const;
const TBARS = ['low', 'middle', 'high', 'absent'] as const;
const IDOTS = ['omitted', 'precise', 'high', 'circle', 'stroke'] as const;
const SIGS = ['matches', 'larger', 'smaller', 'illegible', 'underlined'] as const;
const CONNS = ['connected', 'disconnected', 'mixed'] as const;

function GraphologyTab() {
  const { t } = useT();
  const [form, setForm] = useState<Record<string, string>>({
    slant: 'right', pressure: 'medium', size: 'medium', spacing: 'even', baseline: 'level',
    upperLoops: '', lowerLoops: '', tbar: '', idot: '', signature: '', connected: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<any>(null);

  function set(k: string, v: string) { setForm((s) => ({ ...s, [k]: v })); }

  async function run() {
    setLoading(true); setError(null); setReading(null);
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v));
      const r = await api.graphology(body);
      setReading(r.reading);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      <aside className="space-y-4">
        <Card title={t('biometric.graph.stroke', 'Stroke characteristics')}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('biometric.graph.f.slant', 'Slant')}</Label>    <Sel value={form.slant}    onChange={(v) => set('slant', v)}    options={SLANTS} /></div>
            <div><Label>{t('biometric.graph.f.pressure', 'Pressure')}</Label> <Sel value={form.pressure} onChange={(v) => set('pressure', v)} options={PRESSURES} /></div>
            <div><Label>{t('biometric.graph.f.size', 'Size')}</Label>     <Sel value={form.size}     onChange={(v) => set('size', v)}     options={SIZES} /></div>
            <div><Label>{t('biometric.graph.f.spacing', 'Spacing')}</Label>  <Sel value={form.spacing}  onChange={(v) => set('spacing', v)}  options={SPACINGS} /></div>
            <div><Label>{t('biometric.graph.f.baseline', 'Baseline')}</Label> <Sel value={form.baseline} onChange={(v) => set('baseline', v)} options={BASELINES} /></div>
            <div><Label>{t('biometric.graph.f.connection', 'Connection')}</Label><Sel value={form.connected ?? ''} allowEmpty onChange={(v) => set('connected', v)} options={CONNS} /></div>
          </div>
        </Card>
        <Card title={t('biometric.graph.letterForms', 'Letter forms (optional)')}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('biometric.graph.f.upperLoops', 'Upper loops')}</Label> <Sel value={form.upperLoops ?? ''} allowEmpty onChange={(v) => set('upperLoops', v)} options={LOOPS} /></div>
            <div><Label>{t('biometric.graph.f.lowerLoops', 'Lower loops')}</Label> <Sel value={form.lowerLoops ?? ''} allowEmpty onChange={(v) => set('lowerLoops', v)} options={LOOPS} /></div>
            <div><Label>{t('biometric.graph.f.tbar', 'T-bar')}</Label>       <Sel value={form.tbar ?? ''}       allowEmpty onChange={(v) => set('tbar', v)}       options={TBARS} /></div>
            <div><Label>{t('biometric.graph.f.idot', 'I-dot')}</Label>       <Sel value={form.idot ?? ''}       allowEmpty onChange={(v) => set('idot', v)}       options={IDOTS} /></div>
            <div className="col-span-2"><Label>{t('biometric.graph.f.signature', 'Signature')}</Label><Sel value={form.signature ?? ''} allowEmpty onChange={(v) => set('signature', v)} options={SIGS} /></div>
          </div>
        </Card>
        <SubmitBtn onClick={run} loading={loading} label={t('biometric.btn.analyseHand', 'Analyse handwriting')} />
      </aside>

      <section className="min-w-0">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!reading && !error && !loading && <EmptyState>{t('biometric.graph.empty', 'All stroke fields are required; letter forms are optional.')}</EmptyState>}
        {reading && (
          <>
            <Card className="mb-4" title={t('biometric.graph.bigFive', 'Big-Five profile')}>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {(['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'stability'] as const).map((k) => (
                  <div key={k} className="text-center">
                    <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">{t(`biometric.graph.t.${k}`, k.slice(0, 4))}</div>
                    <div className="text-2xl font-bold text-saffron tabular-nums">{reading.bigFive[k]}</div>
                    <div className="h-1.5 rounded bg-vedicGold/20 overflow-hidden">
                      <div className="h-full bg-saffron" style={{ width: `${reading.bigFive[k]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* summary one-liner is now server-localized; the appended Big-Five
                   numerical breakdown stays English (technical short codes O/C/E/A/S) */}
              <p className="text-sm italic text-vedicMaroon/80 leading-relaxed">{reading.summary}</p>
              {reading.flags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {/* flag prose deferred — short personality summaries from Big-Five thresholds */}
                  {reading.flags.map((f: string, i: number) => <Pill key={i} tone="info"><span lang="en">{f}</span></Pill>)}
                </div>
              )}
            </Card>
            <SectionBlocks sections={reading.sections} />
          </>
        )}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Deep Numerology
// ═══════════════════════════════════════════════════════════════════════════

function NumerologyTab() {
  const { t } = useT();
  const [dob, setDob] = useState('1990-08-15');
  const [name, setName] = useState('Arjun Sharma');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [cmpA, setCmpA] = useState('Arjun Sharma');
  const [cmpB, setCmpB] = useState('Priya Nair');
  const [cmp, setCmp] = useState<any>(null);

  async function run() {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await api.numerologyDeep(dob, name || undefined);
      setResult(r.result);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function runCmp() {
    try {
      const r = await api.numerologyCompatibility(cmpA, cmpB);
      setCmp(r.result);
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      <aside className="space-y-4">
        <Card title={t('biometric.num.input', 'Deep numerology input')}>
          <Label>{t('biometric.num.dob', 'Date of birth')}</Label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
            className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm mb-3" />
          <Label>{t('biometric.num.fullName', 'Full name (optional — enables Chaldean/Pythagorean breakdown)')}</Label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm" />
          <div className="mt-3">
            <SubmitBtn onClick={run} loading={loading} label={t('biometric.btn.compute', 'Compute')} />
          </div>
        </Card>
        <Card title={t('biometric.num.compatibility', 'Name compatibility')}>
          <Label>{t('biometric.num.nameA', 'Name A')}</Label>
          <input value={cmpA} onChange={(e) => setCmpA(e.target.value)}
            className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm mb-2" />
          <Label>{t('biometric.num.nameB', 'Name B')}</Label>
          <input value={cmpB} onChange={(e) => setCmpB(e.target.value)}
            className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm" />
          <button onClick={runCmp}
            className="mt-3 rounded-lg bg-vedicMaroon hover:bg-vedicMaroon/90 text-white px-4 py-2 text-xs font-semibold">
            {t('biometric.btn.compare', 'Compare')}
          </button>
          {cmp && (
            <div className="mt-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-vedicMaroon/60">{t('biometric.num.chaldean', 'Chaldean')}</span>
                {/* TODO(i18n-server): localize quality string */}
                <span className="font-medium" lang="en">{cmp.chaldean.a} · {cmp.chaldean.b} — {cmp.chaldean.quality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-vedicMaroon/60">{t('biometric.num.pythagorean', 'Pythagorean')}</span>
                <span className="font-medium" lang="en">{cmp.pythagorean.a} · {cmp.pythagorean.b} — {cmp.pythagorean.quality}</span>
              </div>
            </div>
          )}
        </Card>
      </aside>

      <section className="min-w-0">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!result && !error && !loading && <EmptyState>{t('biometric.num.empty', 'Enter DOB to compute lifePath, destiny, pinnacles, masters & karmic debts.')}</EmptyState>}
        {result && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <NumBadge title={t('biometric.num.lifePath', 'Life path')} num={result.lifePath.num} master={result.lifePath.master} meaning={result.lifePath.meaning} />
              <NumBadge title={t('biometric.num.destiny', 'Destiny')}   num={result.destiny.num} meaning={result.destiny.meaning} />
              <NumBadge title={t('biometric.num.birthday', 'Birthday')}  num={result.birthday.num} meaning={result.birthday.meaning} />
            </div>

            {result.expression && (
              <Card title={t('biometric.num.cVsP', 'Chaldean vs Pythagorean')}>
                <div className="grid md:grid-cols-3 gap-3 text-xs">
                  <SystemCol sys={t('biometric.num.expression', 'Expression')}  chaldean={result.expression.chaldean} pythagorean={result.expression.pythagorean}
                             cM={result.expression.meaningChaldean} pM={result.expression.meaningPythagorean} />
                  {result.soulUrge && (
                    <SystemCol sys={t('biometric.num.soulUrge', 'Soul urge (vowels)')} chaldean={result.soulUrge.chaldean} pythagorean={result.soulUrge.pythagorean}
                             cM={result.soulUrge.meaningChaldean} pM={result.soulUrge.meaningPythagorean} />
                  )}
                  {result.personality && (
                    <SystemCol sys={t('biometric.num.personality', 'Personality (consonants)')} chaldean={result.personality.chaldean} pythagorean={result.personality.pythagorean}
                             cM={result.personality.meaningChaldean} pM={result.personality.meaningPythagorean} />
                  )}
                </div>
              </Card>
            )}

            <Card title={t('biometric.num.pinnacles', 'Pinnacles & Challenges (life stages)')}>
              <div className="grid md:grid-cols-4 gap-3 text-xs">
                {result.pinnacles.map((p: any, i: number) => (
                  <div key={i} className="rounded-lg border border-vedicGold/30 p-3">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">P{i + 1}</span>
                      <span className="text-xl font-bold text-saffron tabular-nums">{p.num}</span>
                    </div>
                    <div className="text-[10px] text-vedicMaroon/60 mb-1">
                      {p.ends === 999 ? t('biometric.num.endsInf', 'ends ∞') : t('biometric.num.endsAge', 'ends age {n}').replace('{n}', String(p.ends))}
                    </div>
                    {/* TODO(i18n-server): localize p.meaning prose */}
                    <div className="text-[11px] leading-snug" lang="en">{p.meaning}</div>
                    <div className="mt-2 pt-2 border-t border-vedicGold/20 text-[10px]">
                      <span className="text-vedicMaroon/60">{t('biometric.num.challenge', 'Challenge:')} </span>
                      {/* TODO(i18n-server): localize challenge meaning prose */}
                      <span className="text-vedicMaroon/80" lang="en">{result.challenges[i].meaning}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={t('biometric.num.cycles', 'Personal cycles')}>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div><div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">{t('biometric.num.year', 'Year')}</div><div className="text-2xl font-bold text-saffron">{result.personalCycles.year}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">{t('biometric.num.month', 'Month')}</div><div className="text-2xl font-bold text-saffron">{result.personalCycles.month}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">{t('biometric.num.day', 'Day')}</div><div className="text-2xl font-bold text-saffron">{result.personalCycles.day}</div></div>
              </div>
            </Card>

            {(result.masters?.length > 0 || result.karmicDebt?.length > 0) && (
              <Card title={t('biometric.num.masters', 'Masters & karmic debts')}>
                {result.masters.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[11px] uppercase tracking-wider text-vedicMaroon/60 mb-1">{t('biometric.num.masterNumbers', 'Master numbers')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {/* TODO(i18n-server): localize master strings */}
                      {result.masters.map((m: string, i: number) => <Pill key={i} tone="good"><span lang="en">{m}</span></Pill>)}
                    </div>
                  </div>
                )}
                {result.karmicDebt.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-vedicMaroon/60 mb-1">{t('biometric.num.karmicDebts', 'Karmic debts')}</div>
                    <ul className="list-disc pl-5 text-xs space-y-1 text-vedicMaroon/80">
                      {/* TODO(i18n-server): localize karmic debt strings */}
                      {result.karmicDebt.map((k: string, i: number) => <li key={i} lang="en">{k}</li>)}
                    </ul>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function NumBadge({ title, num, master, meaning }: { title: string; num: number; master?: boolean; meaning: string }) {
  const { t } = useT();
  return (
    <Card>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-4xl font-bold text-saffron tabular-nums">{num}</div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">{title}</div>
          {master && <Pill tone="good">{t('biometric.num.master', 'Master')}</Pill>}
        </div>
      </div>
      {/* TODO(i18n-server): localize meaning prose */}
      <p className="text-xs text-vedicMaroon/80 italic leading-relaxed" lang="en">{meaning}</p>
    </Card>
  );
}

function SystemCol({ sys, chaldean, pythagorean, cM, pM }: { sys: string; chaldean: number; pythagorean: number; cM: string; pM: string }) {
  const { t } = useT();
  return (
    <div className="rounded-lg border border-vedicGold/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60 mb-2">{sys}</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div><div className="text-[10px] text-vedicMaroon/60">{t('biometric.num.chaldean', 'Chaldean')}</div><div className="text-xl font-bold text-saffron">{chaldean}</div></div>
        <div><div className="text-[10px] text-vedicMaroon/60">{t('biometric.num.pythagorean', 'Pythagorean')}</div><div className="text-xl font-bold text-saffron">{pythagorean}</div></div>
      </div>
      <div className="text-[11px] space-y-1">
        {/* TODO(i18n-server): localize meaning strings cM/pM */}
        <div><span className="text-vedicMaroon/50">{t('biometric.num.cLabel', 'C: ')}</span><span lang="en">{cM}</span></div>
        <div><span className="text-vedicMaroon/50">{t('biometric.num.pLabel', 'P: ')}</span><span lang="en">{pM}</span></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Tarot
// ═══════════════════════════════════════════════════════════════════════════

const SPREAD_KEYS = ['three-card', 'celtic-cross', 'chart-overlay'] as const;

function TarotTab() {
  const { t } = useT();
  const [spread, setSpread] = useState<'three-card' | 'celtic-cross' | 'chart-overlay'>('three-card');
  const [question, setQuestion] = useState('');
  const [useChart, setUseChart] = useState(false);
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  function localizeSpread(s: string): string {
    if (s === 'three-card') return t('biometric.tarot.spread.three', 'three-card');
    if (s === 'celtic-cross') return t('biometric.tarot.spread.celtic', 'celtic-cross');
    if (s === 'chart-overlay') return t('biometric.tarot.spread.overlay', 'chart-overlay');
    return s;
  }

  async function run() {
    setLoading(true); setError(null); setResult(null);
    try {
      const opts: any = { spread };
      if (question.trim()) opts.question = question.trim();
      if (useChart || spread === 'chart-overlay') {
        if (!birth) {
          setError(t('biometric.tarot.errBirth', 'Birth details required for chart-overlay or chart-seeded reading. Fill the form below.'));
          setLoading(false); return;
        }
        opts.birth = birth;
      }
      const r = await api.tarot(opts);
      setResult(r.result);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  const needBirth = spread === 'chart-overlay' || useChart;

  const saveName = question
    ? t('biometric.tarot.saveWithQ', 'Tarot: {spread} — {q}')
        .replace('{spread}', localizeSpread(spread))
        .replace('{q}', question.slice(0, 24))
    : t('biometric.tarot.saveDefault', 'Tarot: {spread}').replace('{spread}', localizeSpread(spread));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      <aside className="space-y-4">
        <Card title={t('biometric.tarot.spread', 'Tarot spread')}>
          <Label>{t('biometric.tarot.spread.field', 'Spread')}</Label>
          <Sel value={spread} onChange={(v) => v && setSpread(v as any)}
            options={SPREAD_KEYS}
            render={(v) => localizeSpread(v)} />
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <Label>{t('biometric.tarot.question', 'Question (optional)')}</Label>
              <VoiceInputButton onTranscript={(tr) => setQuestion(tr)} title={t('biometric.tarot.voiceTitle', 'Speak your question')} />
            </div>
            <input value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('biometric.tarot.questionPh', 'What should I focus on this year?')}
              className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm" />
          </div>
          {spread !== 'chart-overlay' && (
            <label className="mt-3 flex items-center gap-2 text-xs text-vedicMaroon/80">
              <input type="checkbox" checked={useChart} onChange={(e) => setUseChart(e.target.checked)} />
              {t('biometric.tarot.useChart', 'Seed from birth chart (stable per-chart reading)')}
            </label>
          )}
          <div className="mt-3 flex items-center gap-2">
            <SubmitBtn onClick={run} loading={loading} label={t('biometric.btn.drawCards', 'Draw cards')} />
            {result && (
              <SaveViewButton
                route="/biometric"
                kind="tarot-spread"
                snapshot={{ tab: 'tarot', spread, question, useChart, birth, seed: result.seed }}
                defaultName={saveName}
              />
            )}
          </div>
        </Card>
        {needBirth && (
          <BirthDetailsForm onSubmit={(b) => setBirth(b)} />
        )}
        {birth && needBirth && (
          <div className="text-[11px] text-vedicMaroon/60 px-1">{t('biometric.tarot.captured', 'Chart captured: {place}').replace('{place}', birth.placeName ?? '')}</div>
        )}
      </aside>

      <section className="min-w-0">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!result && !error && !loading && (
          <EmptyState>
            {t('biometric.tarot.empty', "Pick a spread and draw. Chart-overlay gives one card per house (1→12); Celtic Cross uses Waite's classical ten.")}
          </EmptyState>
        )}
        {result && (
          <div className="space-y-4">
            <Card>
              <div className="text-xs uppercase tracking-wider text-vedicMaroon/60">{t('biometric.tarot.seed', 'Seed')}</div>
              <div className="font-mono text-xs text-vedicMaroon/80 truncate mb-2">{result.seed}</div>
              {/* TODO(i18n-server): localize result.summary prose */}
              <p className="text-sm italic text-vedicMaroon/90 leading-relaxed" lang="en">{result.summary}</p>
            </Card>
            <div className={`grid gap-3 ${result.spread === 'chart-overlay' ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
              {result.draws.map((d: any, i: number) => <TarotCard key={i} draw={d} />)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function TarotCard({ draw }: { draw: any }) {
  const { t } = useT();
  const suitColor: Record<string, string> = {
    major: 'bg-vedicMaroon text-white',
    wands: 'bg-orange-600 text-white',
    cups: 'bg-blue-600 text-white',
    swords: 'bg-slate-700 text-white',
    pentacles: 'bg-emerald-700 text-white',
  };
  return (
    <div className={`rounded-xl border border-vedicGold/30 p-3 bg-white ${draw.reversed ? 'ring-1 ring-red-400/40' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        {/* TODO(i18n-server): localize position string */}
        <span className="text-[10px] uppercase tracking-wider text-vedicMaroon/60" lang="en">{draw.position}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${suitColor[draw.card.suit] || 'bg-gray-300'}`} lang="en">
          {draw.card.suit}
        </span>
      </div>
      {/* TODO(i18n-server): localize card name */}
      <div className="font-display text-base font-bold text-vedicMaroon mb-1" lang="en">
        {draw.card.name}
      </div>
      <div className="text-[10px] text-vedicMaroon/60 mb-2">
        {draw.reversed ? t('biometric.tarot.reversed', '⤓ reversed') : t('biometric.tarot.upright', '⤒ upright')}
        {draw.card.element && <> · <span lang="en">{draw.card.element}</span></>}
      </div>
      {/* TODO(i18n-server): localize card upright/reversed text */}
      <p className="text-xs text-vedicMaroon/90 leading-relaxed" lang="en">
        {draw.reversed ? draw.card.reversed : draw.card.upright}
      </p>
    </div>
  );
}
