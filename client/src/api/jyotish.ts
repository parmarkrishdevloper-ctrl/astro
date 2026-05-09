import type {
  BirthInput, KundaliResult, VimshottariResult,
  MatchingResult, PanchangResult, AllDoshasResult, YogaResult,
  ShadbalaResult, NumerologyResult, MuhuratResult, MuhuratEvent, Branding,
  Varga, VargaMeta, DivisionalChart, VargaSummaryRow,
  DeepDashaSnapshot, SubdivideResult, DashaSystemKey,
  DashaSystemMeta, DashaStartInfo,
  AyanamsaInfo, HouseSystemInfo,
  VimsopakaResult, VimsopakaScheme, VimsopakaSchemeInfo,
  IshtaKashtaResult, RemedyResult,
  GocharaResult, SandhiResult,
  AshtakavargaTransitResult, DoubleTransitResult,
  VarshaphalaResult, MuddaPeriod,
  PrashnaResult, PrashnaVerdictResult, PrashnaCategory,
  RectificationEventInput, RectificationResult,
  EventWindow, AuspiciousnessPoint,
  SudarshanaResult, AvasthaEntry,
  EphemerisRow, GraphicalEphemerisSeries,
  WorksheetBundle, WorksheetSectionId,
  FullInterpretation, ClassicalRef,
  AshtakavargaResult,
  JaiminiDashasBundle,
  PredictiveBundle,
} from '../types';

function currentLang(): string {
  try {
    const s = localStorage.getItem('jyotishpro.locale');
    if (s === 'en' || s === 'hi' || s === 'gu' || s === 'sa') return s;
  } catch { /* SSR / private mode */ }
  return 'en';
}

function jsonHeaders(): Record<string, string> {
  return { 'content-type': 'application/json', 'X-Lang': currentLang() };
}

function langHeaders(): Record<string, string> {
  return { 'X-Lang': currentLang() };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`${r.status} ${r.statusText} — ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  if (data.ok === false) throw new Error(data.error ?? 'API error');
  return data as T;
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path, { headers: langHeaders() });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const data = await r.json();
  if (data.ok === false) throw new Error(data.error ?? 'API error');
  return data as T;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const data = await r.json();
  if (data.ok === false) throw new Error(data.error ?? 'API error');
  return data as T;
}

async function rawJson<T>(path: string, method: 'PATCH' | 'DELETE' | 'PUT', body?: unknown): Promise<T> {
  const init: RequestInit = { method, headers: langHeaders() };
  if (body !== undefined) {
    init.headers = jsonHeaders();
    init.body = JSON.stringify(body);
  }
  const r = await fetch(path, init);
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`${r.status} ${r.statusText} — ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  if (data.ok === false) throw new Error(data.error ?? 'API error');
  return data as T;
}

export const api = {
  // ── Kundali / Dasha ───────────────────────────────────────────────────────
  calculate: (input: BirthInput) =>
    post<{ ok: true; kundali: KundaliResult }>('/api/kundali/calculate', input),

  // ── Phase 8d — Ayanamsa + house-system catalogs ───────────────────────────
  ayanamsas: () => get<{ ok: true; ayanamsas: AyanamsaInfo[]; tropical: AyanamsaInfo }>('/api/kundali/ayanamsas'),
  houseSystems: () => get<{ ok: true; systems: HouseSystemInfo[] }>('/api/kundali/house-systems'),

  vimshottari: (input: BirthInput, expand = true) =>
    post<{ ok: true; vimshottari: VimshottariResult }>('/api/dasha/vimshottari', {
      ...input, expand,
    }),

  currentDasha: (input: BirthInput, atDate?: string) =>
    post<{
      ok: true;
      at: string;
      current: { maha: any; antar: any | null; pratyantar: any | null } | null;
    }>('/api/dasha/current', { ...input, atDate }),

  // ── Phase 8b/8c — Multi-system dashas (Vimshottari / Yogini / Ashtottari) ─
  dashaSystems: () =>
    fetch('/api/dasha/systems').then((r) => r.json()) as
      Promise<{ ok: true; systems: DashaSystemMeta[] }>,

  deepDasha: (input: BirthInput, atDate?: string, system: DashaSystemKey = 'vimshottari') =>
    post<{ ok: true; deep: DeepDashaSnapshot; start: DashaStartInfo; system: DashaSystemMeta }>(
      '/api/dasha/deep', { ...input, atDate, system }),

  subdivideDasha: (input: BirthInput, path: number[], system: DashaSystemKey = 'vimshottari') =>
    post<{ ok: true } & SubdivideResult>(
      '/api/dasha/subdivide', { ...input, path, system }),

  // ── Phase 8a — Divisionals (full Shodashvarga) ────────────────────────────
  divisional: (input: BirthInput, vargas?: Varga[]) =>
    post<{ ok: true; ascendant: KundaliResult['ascendant']; charts: Record<Varga, DivisionalChart> }>(
      '/api/kundali/divisional', { ...input, vargas }),

  vargaMeta: () =>
    fetch('/api/kundali/varga-meta').then((r) => r.json()) as
      Promise<{ ok: true; vargas: Varga[]; meta: Record<Varga, VargaMeta> }>,

  vargaSummary: (input: BirthInput) =>
    post<{ ok: true; ascendant: KundaliResult['ascendant']; summary: VargaSummaryRow[] }>(
      '/api/kundali/varga-summary', input),

  // ── Phase 4 ───────────────────────────────────────────────────────────────
  matching: (boy: BirthInput, girl: BirthInput) =>
    post<{ ok: true; matching: MatchingResult }>('/api/matching/ashtakoot', { boy, girl }),

  panchang: (date: string, lat: number, lng: number) =>
    post<{ ok: true; panchang: PanchangResult }>('/api/panchang', { date, lat, lng }),

  yogas: (input: BirthInput) =>
    post<{ ok: true; yogas: YogaResult[] }>('/api/analysis/yogas', input),

  doshas: (input: BirthInput) =>
    post<{ ok: true; doshas: AllDoshasResult }>('/api/analysis/doshas', input),

  shadbala: (input: BirthInput) =>
    post<{ ok: true; shadbala: ShadbalaResult }>('/api/analysis/shadbala', input),

  vimsopakaSchemes: () =>
    get<{ ok: true; schemes: VimsopakaSchemeInfo[] }>('/api/analysis/vimsopaka/schemes'),
  vimsopaka: (input: BirthInput, scheme: VimsopakaScheme = 'shodasha') =>
    post<{ ok: true; vimsopaka: VimsopakaResult }>(`/api/analysis/vimsopaka?scheme=${scheme}`, input),

  ishtaKashta: (input: BirthInput) =>
    post<{ ok: true; ishtaKashta: IshtaKashtaResult }>('/api/analysis/ishta-kashta', input),

  remedies: (input: BirthInput) =>
    post<{ ok: true; remedies: RemedyResult }>('/api/analysis/remedies', input),

  // ── Phase 10 — Predictive precision ──────────────────────────────────────
  gochara: (input: BirthInput, when?: string) =>
    post<{ ok: true; gochara: GocharaResult }>('/api/analysis/gochara', { ...input, when }),

  dashaSandhi: (input: BirthInput, from?: string, to?: string, marginPct = 0.05) =>
    post<{ ok: true; sandhi: SandhiResult }>('/api/analysis/dasha-sandhi', { ...input, from, to, marginPct }),

  ashtakavargaTransit: (input: BirthInput, when?: string) =>
    post<{ ok: true; ashtakavargaTransit: AshtakavargaTransitResult }>(
      '/api/analysis/ashtakavarga-transit', { ...input, when }),

  doubleTransit: (input: BirthInput, from?: string, to?: string, stepDays = 7) =>
    post<{ ok: true; doubleTransit: DoubleTransitResult }>(
      '/api/analysis/double-transit', { ...input, from, to, stepDays }),

  // ── Phase 11 — Varshaphala (Tajaka annual horoscope) ─────────────────────
  varshaphala: (input: BirthInput, age: number) =>
    post<{ ok: true; varshaphala: VarshaphalaResult; muddaDasha: MuddaPeriod[] }>(
      '/api/varshaphala', { ...input, age }),

  // ── Phase 14 — Event prediction + auspiciousness graph ──────────────────
  predictEvents: (input: BirthInput, years = 30) =>
    post<{ ok: true; events: EventWindow[] }>('/api/predict-events', { ...input, years }),

  auspiciousness: (input: BirthInput, years = 30) =>
    post<{ ok: true; points: AuspiciousnessPoint[] }>('/api/auspiciousness', { ...input, years }),

  // ── Phase 13 — Birth-time rectification ──────────────────────────────────
  rectify: (input: BirthInput, events: RectificationEventInput[], windowMinutes = 30) =>
    post<{ ok: true; result: RectificationResult }>('/api/rectify', {
      ...input, events, windowMinutes,
    }),

  // ── Phase 12 — Prashna (horary astrology) ────────────────────────────────
  prashna: (opts: {
    lat: number; lng: number;
    whenISO?: string; question?: string;
    number?: number; category?: PrashnaCategory;
  }) =>
    post<{ ok: true; prashna: PrashnaResult; verdict: PrashnaVerdictResult | null }>(
      '/api/prashna', opts),

  jaimini: (input: BirthInput) =>
    post<{ ok: true; jaimini: any }>('/api/analysis/jaimini', input),

  // ── Phase 8 — Jaimini rashi-based dashas (Chara/Sthira/Narayana/Shoola) ──
  // ── Phase 9 — also includes NiryanaShoola + Padakrama (deep Jaimini) ─────
  jaiminiDashas: async (input: BirthInput): Promise<{ dashas: JaiminiDashasBundle }> => {
    const r = await post<{ ok: true; jaimini: any }>('/api/analysis/jaimini', input);
    return {
      dashas: {
        chara:         r.jaimini.charaDasha         ?? [],
        sthira:        r.jaimini.sthiraDasha        ?? [],
        narayana:      r.jaimini.narayanaDasha      ?? [],
        shoola:        r.jaimini.shoolaDasha        ?? [],
        niryanaShoola: r.jaimini.niryanaShoolaDasha ?? [],
        padakrama:     r.jaimini.padakramaDasha     ?? [],
      },
    };
  },

  // ── Phase 9 — Classical breadth: Lal Kitab, Nadi, Tajika yogas, Sphutas ──
  lalKitab: (input: BirthInput) =>
    post<{ ok: true; lalKitab: any }>('/api/analysis/lal-kitab', input),

  nadi: (input: BirthInput) =>
    post<{ ok: true; nadi: any }>('/api/analysis/nadi', input),

  tajika: (input: BirthInput) =>
    post<{ ok: true; tajika: any }>('/api/analysis/tajika', input),

  sphutas: (input: BirthInput) =>
    post<{ ok: true; sphutas: any }>('/api/analysis/sphutas', input),

  kp: (input: BirthInput) =>
    post<{ ok: true; kp: any }>('/api/analysis/kp', input),

  // ── Phase 10 — Predictive precision (unified bundle) ────────────────────
  predictive: (input: BirthInput, opts?: { when?: string; age?: number; windowYears?: number }) =>
    post<{ ok: true; predictive: PredictiveBundle }>(
      '/api/analysis/predictive',
      { ...input, ...(opts || {}) },
    ),

  // ── Phase 15 — Sudarshana Chakra + Avasthas ──────────────────────────────
  sudarshana: (input: BirthInput) =>
    post<{ ok: true; sudarshana: SudarshanaResult }>('/api/analysis/sudarshana', input),

  avasthas: (input: BirthInput) =>
    post<{ ok: true; avasthas: AvasthaEntry[] }>('/api/analysis/avasthas', input),

  // ── Phase 19 — Ashtakavarga (BAV + SAV + shodhita) ──────────────────────
  ashtakavarga: (input: BirthInput) =>
    post<{ ok: true; ashtakavarga: AshtakavargaResult }>('/api/ashtakavarga', input),

  // ── Phase 18 — Interpretation + classical references ────────────────────
  interpret: (input: BirthInput) =>
    post<{ ok: true; interpretation: FullInterpretation }>('/api/interpret', input),

  classicalRefs: async (tags?: string[]) => {
    const qs = tags && tags.length ? `?tags=${encodeURIComponent(tags.join(','))}` : '';
    const r = await fetch(`/api/refs${qs}`);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json() as Promise<{ ok: true; refs: ClassicalRef[] }>;
  },

  // ── Phase 17 — Worksheet PDF bundles ─────────────────────────────────────
  worksheetBundles: () =>
    get<{ ok: true; bundles: WorksheetBundle[] }>('/api/worksheet/bundles'),

  worksheetBundlePdf: async (
    bundleId: string, input: BirthInput, subjectName?: string,
  ): Promise<Blob> => {
    const r = await fetch(`/api/worksheet/bundle/${encodeURIComponent(bundleId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Lang': currentLang() },
      body: JSON.stringify({ ...input, subjectName }),
    });
    if (!r.ok) throw new Error(`Worksheet PDF: ${r.status} ${r.statusText}`);
    return r.blob();
  },

  worksheetCustomPdf: async (
    input: BirthInput,
    spec: { title: string; sections: { id: WorksheetSectionId }[]; subjectName?: string },
  ): Promise<Blob> => {
    const r = await fetch('/api/worksheet/custom', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Lang': currentLang() },
      body: JSON.stringify({ ...input, spec }),
    });
    if (!r.ok) throw new Error(`Worksheet PDF: ${r.status} ${r.statusText}`);
    return r.blob();
  },

  // ── Phase 16 — Ephemeris (tabular + graphical) ───────────────────────────
  ephemeris: async (startISO: string, days: number) => {
    const r = await fetch(`/api/ephemeris?start=${encodeURIComponent(startISO)}&days=${days}`);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json() as Promise<{ ok: true; ephemeris: EphemerisRow[] }>;
  },
  graphicalEphemeris: async (startISO: string, days: number) => {
    const r = await fetch(`/api/ephemeris/graphical?start=${encodeURIComponent(startISO)}&days=${days}`);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json() as Promise<{ ok: true; series: GraphicalEphemerisSeries[] }>;
  },

  // ── Phase 21 — Quality / accuracy ────────────────────────────────────────
  qualityOptions: () =>
    fetch('/api/quality/options').then((r) => r.json()) as Promise<{ ok: true; ayanamsas: Array<{ key: string; sidmId: number }>; houseSystems: Array<{ key: string; code: string }> }>,
  famousList: () =>
    fetch('/api/quality/famous').then((r) => r.json()) as Promise<{ ok: true; charts: any[] }>,
  famousKundali: (id: string, opts?: { ayanamsa?: string; houseSystem?: string }) =>
    post<{ ok: true; kundali: any; famous: any }>(`/api/quality/famous/${id}/kundali`, opts ?? {}),

  // ── Phase 20 — Global search ─────────────────────────────────────────────
  globalSearch: (q: string, limit = 40) =>
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`).then((r) => r.json()) as
      Promise<{ ok: true; hits: Array<{ kind: string; id: string; title: string; snippet?: string; tags?: string[]; score: number; url: string; meta?: any }> }>,

  // ── Phase 19 — Offline / privacy ─────────────────────────────────────────
  offlineStatus: () =>
    fetch('/api/offline/status').then((r) => r.json()) as Promise<{ ok: true; status: any }>,
  backupExport: (passphrase?: string) =>
    post<{ ok: true; backup: any }>('/api/offline/backup', { passphrase }),
  backupRestore: (envelope: any, passphrase?: string, replaceExisting = false) =>
    post<{ ok: true; result: { imported: number; skipped: number; replaced: boolean } }>(
      '/api/offline/restore', { envelope, passphrase, replaceExisting }),
  localNarrative: (input: BirthInput) =>
    post<{ ok: true; source: 'ollama' | 'rule-based'; model?: string; narrative: string }>(
      '/api/offline/narrative', input),

  // ── Phase 18 — Interactive chart ─────────────────────────────────────────
  planetDetail: (input: BirthInput, planetId: string, whenISO?: string) =>
    post<{ ok: true; detail: any }>('/api/interactive/planet-detail', { ...input, planetId, whenISO }),
  dispositorTree: (input: BirthInput) =>
    post<{ ok: true; tree: any }>('/api/interactive/dispositor-tree', input),
  aspectWeb: (input: BirthInput) =>
    post<{ ok: true; web: any }>('/api/interactive/aspect-web', input),
  compare: (a: BirthInput, b: BirthInput) =>
    post<{ ok: true; synastry: any; composite: any }>('/api/interactive/compare', { a, b }),

  // ── Phase 17 — Learning / tutor ──────────────────────────────────────────
  encyclopedia: (kind?: string, q?: string) => {
    const qs = new URLSearchParams();
    if (kind) qs.set('kind', kind);
    if (q) qs.set('q', q);
    return fetch(`/api/learn/encyclopedia?${qs}`).then((r) => r.json()) as Promise<{ ok: true; entries: any[] }>;
  },
  encEntry: (kind: string, id: string) =>
    fetch(`/api/learn/encyclopedia/${kind}/${encodeURIComponent(id)}`).then((r) => r.json()) as Promise<{ ok: true; entry: any }>,
  slokas: (topic?: string, q?: string) => {
    const qs = new URLSearchParams();
    if (topic) qs.set('topic', topic);
    if (q) qs.set('q', q);
    return fetch(`/api/learn/slokas?${qs}`).then((r) => r.json()) as Promise<{ ok: true; slokas: any[] }>;
  },
  explainYoga: (id: string) =>
    fetch(`/api/learn/explain-yoga/${encodeURIComponent(id)}`).then((r) => r.json()) as Promise<{ ok: true; explanation: any }>,
  tutor: (input: BirthInput) =>
    post<{ ok: true; lessons: any[] }>('/api/learn/tutor', input),
  flashcards: (topic: string) =>
    fetch(`/api/learn/flashcards/${topic}`).then((r) => r.json()) as Promise<{ ok: true; cards: any[] }>,
  learnSearch: (q: string) =>
    fetch(`/api/learn/search?q=${encodeURIComponent(q)}`).then((r) => r.json()) as Promise<{ ok: true; results: any }>,

  // ── Phase 16 — Personal knowledge base ───────────────────────────────────
  libraryList: (rel?: string) => {
    const qs = rel ? `?rel=${encodeURIComponent(rel)}` : '';
    return fetch(`/api/library/charts${qs}`).then((r) => r.json()) as Promise<{ ok: true; charts: any[] }>;
  },
  libraryGet: (id: string) =>
    fetch(`/api/library/charts/${id}`).then((r) => r.json()) as Promise<{ ok: true; chart: any }>,
  libraryCreate: (chart: any) =>
    post<{ ok: true; chart: any }>('/api/library/charts', chart),
  libraryUpdate: (id: string, patch: any) =>
    fetch(`/api/library/charts/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) })
      .then((r) => r.json()) as Promise<{ ok: true; chart: any }>,
  libraryDelete: (id: string) =>
    fetch(`/api/library/charts/${id}`, { method: 'DELETE' })
      .then((r) => r.json()) as Promise<{ ok: true }>,
  libraryAddEvent: (id: string, ev: { date: string; category: string; title: string; notes?: string }) =>
    post<{ ok: true; event: any; snapshot?: any }>(`/api/library/charts/${id}/events`, ev),
  libraryDeleteEvent: (id: string, eventId: string) =>
    fetch(`/api/library/charts/${id}/events/${eventId}`, { method: 'DELETE' }).then((r) => r.json()) as Promise<{ ok: true }>,
  libraryAddPrediction: (id: string, p: { forDate?: string; forDateEnd?: string; category: string; text: string }) =>
    post<{ ok: true; prediction: any }>(`/api/library/charts/${id}/predictions`, p),
  libraryUpdatePrediction: (id: string, predId: string, patch: { outcome?: string; outcomeNotes?: string; text?: string }) =>
    fetch(`/api/library/charts/${id}/predictions/${predId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) })
      .then((r) => r.json()) as Promise<{ ok: true; prediction: any }>,
  libraryDeletePrediction: (id: string, predId: string) =>
    fetch(`/api/library/charts/${id}/predictions/${predId}`, { method: 'DELETE' }).then((r) => r.json()) as Promise<{ ok: true }>,
  librarySaveNote: (id: string, note: { scope: 'chart' | 'planet' | 'house'; target?: string; markdown: string }) => {
    return fetch(`/api/library/charts/${id}/notes`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(note) })
      .then((r) => r.json()) as Promise<{ ok: true; notes: any[] }>;
  },

  // ── Phase 15 — Timing / prediction ────────────────────────────────────────
  horoscope: (input: BirthInput, scope: 'day' | 'week' | 'month', whenISO?: string) =>
    post<{ ok: true; horoscope: any }>('/api/horoscope', { ...input, scope, whenISO }),

  transitHeatmap: (input: BirthInput, start: string, days: number) =>
    post<{ ok: true; heatmap: Array<{ date: string; score: number; rawScore: number;
      category: 'excellent' | 'good' | 'neutral' | 'caution' | 'difficult'; factors: string[] }> }>(
      '/api/transit-heatmap', { ...input, start, days }),

  dashaTransitAlerts: (input: BirthInput, start: string, days: number, minScore = 2) =>
    post<{ ok: true; alerts: any[] }>('/api/dasha-transit-alerts', { ...input, start, days, minScore }),

  eclipseJournal: (start: string, days: number, input?: BirthInput) =>
    post<{ ok: true; journal: { eclipses: any[]; ingresses: any[] } }>(
      '/api/eclipse-journal', { start, days, ...(input ?? {}) }),

  rxCombust: async (start: string, days: number) => {
    const r = await fetch(`/api/rx-combust?start=${encodeURIComponent(start)}&days=${days}`);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json() as Promise<{ ok: true; events: any[] }>;
  },

  lifeAreas: (input: BirthInput) =>
    post<{ ok: true; lifeAreas: {
      medical: any; career: any; progeny: any; wealth: any;
    } }>('/api/analysis/life-areas', input),

  sensitivePoints: (input: BirthInput) =>
    post<{ ok: true; sensitivePoints: {
      isDayBirth: boolean;
      points: Array<{ id: string; name: string; longitude: number;
        rashi: { num: number; name: string; degInRashi: number };
        nakshatra: { num: number; name: string; pada: number };
        house: number; description: string; }>;
      preNatalEclipses: {
        solar: null | { type: 'solar' | 'lunar'; utc: string;
          sunLongitude: number; moonLongitude: number;
          rashiSun: { num: number; name: string }; rashiMoon: { num: number; name: string };
          daysBeforeBirth: number; };
        lunar: null | { type: 'solar' | 'lunar'; utc: string;
          sunLongitude: number; moonLongitude: number;
          rashiSun: { num: number; name: string }; rashiMoon: { num: number; name: string };
          daysBeforeBirth: number; };
      };
    } }>('/api/analysis/sensitive-points', input),

  upagrahas: (input: BirthInput) =>
    post<{ ok: true; upagrahas: {
      kalaGroup: Array<{ id: string; name: string; longitude: number;
        rashi: { num: number; name: string; degInRashi: number };
        nakshatra: { num: number; name: string; pada: number };
        house: number; formula: string; }>;
      gulika: null | {
        id: string; name: string; longitude: number;
        rashi: { num: number; name: string; degInRashi: number };
        nakshatra: { num: number; name: string; pada: number };
        house: number; formula: string;
      };
      mandi: null | {
        id: string; name: string; longitude: number;
        rashi: { num: number; name: string; degInRashi: number };
        nakshatra: { num: number; name: string; pada: number };
        house: number; formula: string;
      };
      saturnSegment: { isDayBirth: boolean; segmentNumber: number | null;
        startUTC: string | null; midUTC: string | null; endUTC: string | null; };
    } }>('/api/analysis/upagrahas', input),

  chalit: (input: BirthInput, method: 'placidus' | 'sripati' = 'placidus') =>
    post<{ ok: true; chalit: {
      method: 'placidus' | 'sripati';
      bhavas: Array<{ num: number; start: number; end: number; midpoint: number;
                      rashiAtStart: { num: number; name: string };
                      rashiAtMid:   { num: number; name: string } }>;
      planets: Array<{ id: string; longitude: number; wholeSignHouse: number;
                       chalitHouse: number; shifted: boolean;
                       shiftDirection: 'forward' | 'backward' | 'same' }>;
      shiftedPlanets: string[];
    } }>('/api/analysis/chalit', { ...input, method }),

  full: (input: BirthInput) =>
    post<{
      ok: true;
      kundali: KundaliResult;
      yogas: YogaResult[];
      doshas: AllDoshasResult;
      shadbala: ShadbalaResult;
    }>('/api/analysis/full', input),

  numerology: (dob: string, name?: string) =>
    post<{ ok: true; numerology: NumerologyResult }>('/api/numerology', { dob, name }),

  muhurat: (event: MuhuratEvent, startDate: string, endDate: string, lat: number, lng: number) =>
    post<{ ok: true; muhurat: MuhuratResult }>('/api/muhurat', { event, startDate, endDate, lat, lng }),

  muhuratAdvanced: (event: MuhuratEvent, startDate: string, endDate: string, lat: number, lng: number, opts?: { birthNakshatra?: number; stepMinutes?: number }) =>
    post<{ ok: true; muhurat: {
      event: MuhuratEvent;
      slots: Array<{
        start: string; end: string; score: number;
        hora: string; chaughadia: string; chaughadiaQuality: 'good' | 'neutral' | 'bad';
        reasons: string[]; warnings: string[];
        panchang: { tithi: string; nakshatra: string; vara: string; yoga: string };
        tara?: { num: number; name: string; score: number };
      }>;
      totalSlotsEvaluated: number;
    } }>('/api/muhurat/advanced', { event, startDate, endDate, lat, lng, ...opts }),

  // ── Phase 5 ───────────────────────────────────────────────────────────────
  pdfKundali: async (input: BirthInput, subjectName?: string): Promise<Blob> => {
    const r = await fetch('/api/pdf/kundali', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Lang': currentLang() },
      body: JSON.stringify({ ...input, subjectName }),
    });
    if (!r.ok) throw new Error(`PDF: ${r.status} ${r.statusText}`);
    return r.blob();
  },

  pdfMatching: async (
    boy: BirthInput, girl: BirthInput,
    boyName?: string, girlName?: string,
  ): Promise<Blob> => {
    const r = await fetch('/api/pdf/matching', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Lang': currentLang() },
      body: JSON.stringify({ boy, girl, boyName, girlName }),
    });
    if (!r.ok) throw new Error(`PDF: ${r.status} ${r.statusText}`);
    return r.blob();
  },

  getBranding: () =>
    get<{ ok: true; branding: Branding }>('/api/admin/branding'),
  setBranding: (patch: Partial<Branding>) =>
    put<{ ok: true; branding: Branding }>('/api/admin/branding', patch),

  // ── Phase 11 — Prashna schools, Chakras, Muhurta Pro ─────────────────────

  prashnaSchools: (opts: {
    whenISO?: string; lat: number; lng: number;
    question?: string; number?: number; category?: PrashnaCategory;
    dayIndex?: number; waxing?: boolean; hoursSinceSunrise?: number;
    tithiNum?: number; horaRuler?: string;
  }) =>
    post<{ ok: true; schools: {
      tajika: any; narchintamani: any; shatpanchasika: any; swara: any; arudha: any;
    } }>('/api/prashna/schools', opts),

  prashnaTajika: (opts: { whenISO?: string; lat: number; lng: number; question?: string; number?: number; category: PrashnaCategory }) =>
    post<{ ok: true; tajika: any }>('/api/prashna/tajika', opts),
  prashnaNarchintamani: (opts: { whenISO?: string; lat: number; lng: number; question?: string; number?: number; tithiNum?: number; horaRuler?: string }) =>
    post<{ ok: true; narchintamani: any }>('/api/prashna/narchintamani', opts),
  prashnaShatpanchasika: (opts: { whenISO?: string; lat: number; lng: number; question?: string; number?: number }) =>
    post<{ ok: true; shatpanchasika: any }>('/api/prashna/shatpanchasika', opts),
  prashnaSwara: (opts: { dayIndex: number; waxing: boolean; hoursSinceSunrise: number; whenISO?: string }) =>
    post<{ ok: true; swara: any }>('/api/prashna/swara', opts),
  prashnaArudha: (opts: { whenISO?: string; lat: number; lng: number; question?: string; number?: number; category?: PrashnaCategory }) =>
    post<{ ok: true; arudha: any }>('/api/prashna/arudha', opts),

  chakrasAll: (input: BirthInput, when?: string) =>
    post<{ ok: true; chakras: {
      sarvatobhadra: any; kalanala: any; shoola: any; kota: any; chatushpata: any;
    } }>('/api/chakras/all', { ...input, when }),

  sarvatobhadra: (input: BirthInput) =>
    post<{ ok: true; sarvatobhadra: any }>('/api/chakras/sarvatobhadra', input),
  kalanala: (input: BirthInput) =>
    post<{ ok: true; kalanala: any }>('/api/chakras/kalanala', input),
  shoolaChakra: (input: BirthInput, when?: string) =>
    post<{ ok: true; shoola: any }>('/api/chakras/shoola', { ...input, when }),
  kotaChakra: (input: BirthInput) =>
    post<{ ok: true; kota: any }>('/api/chakras/kota', input),
  chatushpata: (input: BirthInput) =>
    post<{ ok: true; chatushpata: any }>('/api/chakras/chatushpata', input),

  muhurtaPresets: () =>
    get<{ ok: true; presets: Array<{ key: string; label: string; category: string; note: string }> }>('/api/muhurta-pro/presets'),
  muhurtaPresetDetail: (key: string) =>
    get<{ ok: true; preset: any }>(`/api/muhurta-pro/presets/${encodeURIComponent(key)}`),
  muhurtaYogas: (opts: { weekday: number; nakshatra: number; tithi: number; birthNak?: number; sunRashi?: number }) =>
    post<{ ok: true; yogas: Array<{ name: string; active: boolean; reason: string; strength: 'weak'|'moderate'|'strong' }> }>('/api/muhurta-pro/yogas', opts),
  muhurtaDay: (opts: { date?: string; lat: number; lng: number; birthNak?: number }) =>
    post<{ ok: true; day: any }>('/api/muhurta-pro/day', opts),
  muhurtaWeek: (opts: { start?: string; lat: number; lng: number; birthNak?: number }) =>
    post<{ ok: true; days: any[] }>('/api/muhurta-pro/week', opts),
  varjyamWidget: (opts: { date?: string; lat: number; lng: number; days?: number }) =>
    post<{ ok: true; varjyam: any[] }>('/api/muhurta-pro/varjyam', opts),
  muhurtaFind: (opts: {
    presetKey?: string; event?: MuhuratEvent;
    startDate: string; endDate: string; lat: number; lng: number;
    birthNakshatra?: number; stepMinutes?: number;
  }) =>
    post<{ ok: true; preset: any; result: any }>('/api/muhurta-pro/find', opts),

  // ── Phase 12 — Remedies (yantras, gemstones, remedy log) ─────────────────
  yantrasList: () =>
    get<{ ok: true; yantras: any[] }>('/api/remedies/yantras'),
  yantraGet: (planet: string) =>
    get<{ ok: true; yantra: any }>(`/api/remedies/yantras/${encodeURIComponent(planet)}`),
  gemstonesList: () =>
    get<{ ok: true; gemstones: any[] }>('/api/remedies/gemstones'),
  gemstonesRecommend: (input: BirthInput & { ageYears?: number; bodyFrame?: 'small' | 'medium' | 'large'; referenceDateISO?: string }) =>
    post<{ ok: true; report: any }>('/api/remedies/gemstones/recommend', input),
  remedyLogList: (filter?: { chartId?: string; status?: string; kind?: string; planet?: string }) => {
    const qs = new URLSearchParams();
    if (filter?.chartId) qs.set('chartId', filter.chartId);
    if (filter?.status)  qs.set('status', filter.status);
    if (filter?.kind)    qs.set('kind', filter.kind);
    if (filter?.planet)  qs.set('planet', filter.planet);
    const suffix = qs.toString() ? `?${qs}` : '';
    return get<{ ok: true; entries: any[] }>(`/api/remedies/log${suffix}`);
  },
  remedyLogCreate: (entry: {
    chartId?: string; planet?: string; kind: string; title: string;
    details?: string; startedAt?: string; endsAt?: string;
    recurrence?: { weekdayNum?: number; timeOfDay?: string; countPerSession?: number };
    progress?: { sessionsCompleted?: number; totalCount?: number; targetCount?: number };
    status?: string; notes?: string;
  }) =>
    post<{ ok: true; entry: any }>('/api/remedies/log', entry),
  remedyLogUpdate: (id: string, patch: Record<string, any>) =>
    fetch(`/api/remedies/log/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }).then((r) => r.json()) as Promise<{ ok: true; entry: any }>,
  remedyLogDelete: (id: string) =>
    fetch(`/api/remedies/log/${id}`, { method: 'DELETE' })
      .then((r) => r.json()) as Promise<{ ok: true }>,
  remedyLogSession: (id: string, session: { count?: number; at?: string }) =>
    post<{ ok: true; entry: any }>(`/api/remedies/log/${id}/session`, session),

  // ── Phase 13 — Specialty (Vastu, Medical, Marital, Career, Financial) ────
  specialtyDirections: () =>
    get<{ ok: true; directions: any[] }>('/api/specialty/vastu/directions'),
  specialtyVastu: (input: BirthInput) =>
    post<{ ok: true; report: any }>('/api/specialty/vastu', input),
  specialtyMedical: (input: BirthInput) =>
    post<{ ok: true; report: any }>('/api/specialty/medical', input),
  specialtyMarital: (input: BirthInput) =>
    post<{ ok: true; report: any }>('/api/specialty/marital', input),
  specialtyCareer: (input: BirthInput) =>
    post<{ ok: true; report: any }>('/api/specialty/career', input),
  specialtyFinancial: (input: BirthInput) =>
    post<{ ok: true; report: any }>('/api/specialty/financial', input),

  // ── Phase 14 — Research (pattern / timeline / stats / famous / rectify / notes)
  researchPatternPresets: () =>
    get<{ ok: true; presets: { id: string; label: string; query: string }[] }>(
      '/api/research/pattern/presets',
    ),
  researchPattern: (birth: BirthInput, query: string) =>
    post<{ ok: true; result: any }>('/api/research/pattern', { birth, query }),
  researchTimeline: (body: {
    birth: BirthInput;
    from?: string; to?: string;
    transitPlanets?: string[];
    events?: { date: string; title: string; category?: string }[];
  }) => post<{ ok: true; overlay: any }>('/api/research/timeline', body),
  researchStats: (body: {
    samples: { label: string; birth: BirthInput; tag?: string }[];
    query: string; groupByTag?: boolean;
  }) => post<{ ok: true; result: any }>('/api/research/stats', body),
  researchDistribution: (body: {
    samples: { label: string; birth: BirthInput; tag?: string }[];
    facet: 'lagnaSign' | 'moonSign' | 'sunSign' | 'nakLord' | 'planetSign';
    planet?: string;
  }) => post<{ ok: true; result: any }>('/api/research/distribution', body),
  researchFamous: () =>
    get<{ ok: true; charts: any[] }>('/api/research/famous'),
  researchFamousMatch: (birth: BirthInput, topN = 5) =>
    post<{ ok: true; matches: any[] }>('/api/research/famous/match', { birth, topN }),
  researchRectifyDeep: (body: {
    birth: BirthInput;
    events: { date: string; category: string; house: number; karaka?: string; weight?: number }[];
    windowMinutes?: number; stepMinutes?: number;
  }) => post<{ ok: true; result: any }>('/api/research/rectify-deep', body),
  researchNotesList: (kind?: string, tag?: string) => {
    const qs = new URLSearchParams();
    if (kind) qs.set('kind', kind);
    if (tag)  qs.set('tag',  tag);
    const suffix = qs.toString() ? `?${qs}` : '';
    return get<{ ok: true; notes: any[] }>(`/api/research/notes${suffix}`);
  },
  researchNotesCreate: (entry: {
    kind: string; title: string; body?: string; payload?: any;
    tags?: string[]; pinned?: boolean;
  }) => post<{ ok: true; note: any }>('/api/research/notes', entry),
  researchNotesUpdate: (id: string, patch: Record<string, any>) =>
    fetch(`/api/research/notes/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }).then((r) => r.json()) as Promise<{ ok: true; note: any }>,
  researchNotesDelete: (id: string) =>
    fetch(`/api/research/notes/${id}`, { method: 'DELETE' })
      .then((r) => r.json()) as Promise<{ ok: true }>,

  // Phase 15 — Classical texts
  classicalTexts: () =>
    get<{ ok: true; texts: { source: string; author: string; era: string; note: string; quoteCount: number }[] }>(
      '/api/classical/quotes/texts',
    ),
  classicalQuotes: (birth: BirthInput, opts?: { sources?: string[]; tags?: string[]; limit?: number }) =>
    post<{ ok: true; linked: { quote: any; matchedOn: string[]; score: number }[] }>(
      '/api/classical/quotes', { birth, ...(opts ?? {}) },
    ),
  classicalQuotesSearch: (query: string, limit = 30) =>
    post<{ ok: true; quotes: any[] }>('/api/classical/quotes/search', { query, limit }),
  avasthasDeep: (birth: BirthInput) =>
    post<{ ok: true; avasthas: any[] }>('/api/classical/avasthas-deep', { birth }),

  // Phase 16 — Calendar
  calendarLive: (lat: number, lng: number, now?: string) =>
    post<{ ok: true; live: any }>('/api/calendar/live', { lat, lng, now }),
  calendarYear: (lat: number, lng: number, year: number) =>
    post<{ ok: true; year: number; days: any[]; segments: any[] }>(
      '/api/calendar/year', { lat, lng, year },
    ),
  calendarRange: (lat: number, lng: number, start: string, end: string) =>
    post<{ ok: true; days: any[]; segments: any[] }>(
      '/api/calendar/range', { lat, lng, start, end },
    ),
  calendarFestivals: (lat: number, lng: number, start: string, end: string) =>
    post<{ ok: true; festivals: any[] }>(
      '/api/calendar/festivals', { lat, lng, start, end },
    ),
  calendarFestivalDefs: () =>
    get<{ ok: true; defs: any[] }>('/api/calendar/festivals/defs'),

  // Phase 17 — Print / Export
  pdfVarshphal: async (input: BirthInput, age: number, subjectName?: string): Promise<Blob> => {
    const r = await fetch('/api/pdf/varshphal', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Lang': currentLang() },
      body: JSON.stringify({ ...input, age, subjectName }),
    });
    if (!r.ok) throw new Error(`PDF: ${r.status} ${r.statusText}`);
    return r.blob();
  },
  pdfMuhurat: async (opts: {
    event: MuhuratEvent; startDate: string; endDate: string;
    lat: number; lng: number;
    eventLabel?: string; subjectName?: string; locationLabel?: string;
  }): Promise<Blob> => {
    const r = await fetch('/api/pdf/muhurat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Lang': currentLang() },
      body: JSON.stringify(opts),
    });
    if (!r.ok) throw new Error(`PDF: ${r.status} ${r.statusText}`);
    return r.blob();
  },
  customSections: () =>
    get<{ ok: true; sections: Array<{ id: string; label: string; note: string }> }>(
      '/api/pdf/custom/sections',
    ),
  pdfCustom: async (opts: {
    birth: BirthInput;
    sections: string[];
    subjectName?: string;
    title?: string;
    age?: number;
  }): Promise<Blob> => {
    const r = await fetch('/api/pdf/custom', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Lang': currentLang() },
      body: JSON.stringify(opts),
    });
    if (!r.ok) throw new Error(`PDF: ${r.status} ${r.statusText}`);
    return r.blob();
  },
  exportCsv: async (input: BirthInput): Promise<Blob> => {
    const r = await fetch('/api/export/csv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!r.ok) throw new Error(`CSV: ${r.status} ${r.statusText}`);
    return r.blob();
  },
  exportXlsx: async (input: BirthInput): Promise<Blob> => {
    const r = await fetch('/api/export/xlsx', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!r.ok) throw new Error(`XLSX: ${r.status} ${r.statusText}`);
    return r.blob();
  },
  exportSvg: async (input: BirthInput, variant: 'north' | 'south' = 'north', size = 600, download = false): Promise<Blob> => {
    const r = await fetch('/api/export/svg', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...input, variant, size, download }),
    });
    if (!r.ok) throw new Error(`SVG: ${r.status} ${r.statusText}`);
    return r.blob();
  },
  exportPng: async (input: BirthInput, variant: 'north' | 'south' = 'north', scale = 3): Promise<Blob> => {
    const r = await fetch('/api/export/png', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...input, variant, scale }),
    });
    if (!r.ok) throw new Error(`PNG: ${r.status} ${r.statusText}`);
    return r.blob();
  },

  // ── Phase 18 — AI / Narrative (rule-based local NLG, no LLM) ─────────────
  narrative: (
    birth: BirthInput,
    locale: 'en' | 'hi' | 'gu' | 'sa' = 'en',
    sections?: string[],
  ) =>
    post<{ ok: true; report: {
      locale: string;
      sections: Array<{ id: string; heading: string; paragraphs: string[] }>;
      meta?: {
        ascendant?: { sign: string; nakshatra: string };
        moonSign?: string;
        sunSign?: string;
        dasha?: { maha: string; antar?: string };
      };
    } }>('/api/narrative', { birth, locale, sections }),

  narrativeSection: (
    birth: BirthInput,
    section: string,
    locale: 'en' | 'hi' | 'gu' | 'sa' = 'en',
  ) =>
    post<{ ok: true; locale: string; section: { id: string; heading: string; paragraphs: string[] } }>(
      '/api/narrative/section', { birth, section, locale }),

  journalDay: (
    birth: BirthInput,
    date: string,
    lat: number,
    lng: number,
    locale: 'en' | 'hi' | 'gu' | 'sa' = 'en',
  ) =>
    post<{ ok: true; locale: string; entry: {
      date: string;
      weekday: string;
      paragraphs: string[];
      signals: {
        nakshatra: string; tithi: string; yoga: string;
        sunSign: string; moonSign: string;
        rahuKaal?: string; abhijit?: string; dasha?: string;
      };
    } }>('/api/journal/day', { birth, date, lat, lng, locale }),

  journalRange: (
    birth: BirthInput,
    from: string,
    to: string,
    lat: number,
    lng: number,
    locale: 'en' | 'hi' | 'gu' | 'sa' = 'en',
  ) =>
    post<{ ok: true; locale: string; from: string; to: string; entries: Array<{
      date: string;
      weekday: string;
      paragraphs: string[];
      signals: {
        nakshatra: string; tithi: string; yoga: string;
        sunSign: string; moonSign: string;
        rahuKaal?: string; abhijit?: string; dasha?: string;
      };
    }> }>('/api/journal/range', { birth, from, to, lat, lng, locale }),

  compareNarrative: (
    a: BirthInput,
    b: BirthInput,
    locale: 'en' | 'hi' | 'gu' | 'sa' = 'en',
  ) =>
    post<{ ok: true; compare: {
      locale: string;
      gunMilanScore?: number;
      compatibility: 'excellent' | 'good' | 'moderate' | 'challenging';
      paragraphs: Array<{ heading: string; text: string }>;
      overlays: {
        aOnB: Array<{ planet: string; house: number; meaning: string }>;
        bOnA: Array<{ planet: string; house: number; meaning: string }>;
      };
      moonAxis: {
        aMoonSign: string;
        bMoonSign: string;
        relativeHouse: number;
        note: string;
      };
    } }>('/api/compare/narrative', { a, b, locale }),

  // ── Phase 19 — Biometric (palmistry / samudrika / graphology / deep
  //   numerology / tarot). Local NLG; no external APIs.
  palmistry: (input: any) =>
    post<{ ok: true; reading: {
      summary: string;
      sections: Array<{ id: string; heading: string; paragraphs: string[] }>;
      highlights: string[];
      notes: string[];
    } }>('/api/palmistry', input),

  samudrika: (input: any) =>
    post<{ ok: true; reading: {
      summary: string;
      bodyType: string;
      sections: Array<{ id: string; heading: string; paragraphs: string[] }>;
      auspicious: string[];
      inauspicious: string[];
      notes: string[];
    } }>('/api/samudrika', input),

  graphology: (input: any) =>
    post<{ ok: true; reading: {
      summary: string;
      bigFive: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        stability: number;
      };
      sections: Array<{ id: string; heading: string; paragraphs: string[] }>;
      flags: string[];
    } }>('/api/graphology', input),

  numerologyDeep: (dob: string, name?: string, today?: string) =>
    post<{ ok: true; result: {
      dob: string;
      name?: string;
      lifePath: { num: number; master: boolean; meaning: string };
      destiny: { num: number; meaning: string };
      birthday: { num: number; meaning: string };
      expression?: { chaldean: number; pythagorean: number; meaningChaldean: string; meaningPythagorean: string };
      soulUrge?: { chaldean: number; pythagorean: number; meaningChaldean: string; meaningPythagorean: string };
      personality?: { chaldean: number; pythagorean: number; meaningChaldean: string; meaningPythagorean: string };
      chaldean?: { sum: number; root: number; rootMaster: number; meaning: string };
      pythagorean?: { sum: number; root: number; rootMaster: number; meaning: string };
      pinnacles: Array<{ num: number; ends: number; meaning: string }>;
      challenges: Array<{ num: number; ends: number; meaning: string }>;
      personalCycles: { year: number; month: number; day: number };
      karmicDebt: string[];
      masters: string[];
    } }>('/api/numerology-deep', { dob, name, today }),

  numerologyCompatibility: (nameA: string, nameB: string) =>
    post<{ ok: true; result: {
      chaldean: { a: number; b: number; delta: number; quality: string };
      pythagorean: { a: number; b: number; delta: number; quality: string };
    } }>('/api/numerology-compatibility', { nameA, nameB }),

  tarot: (opts: {
    spread: 'three-card' | 'celtic-cross' | 'chart-overlay';
    question?: string;
    seed?: string;
    birth?: BirthInput;
  }) =>
    post<{ ok: true; result: {
      spread: 'three-card' | 'celtic-cross' | 'chart-overlay';
      seed: string;
      question?: string;
      draws: Array<{
        card: {
          id: number; name: string; suit: 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
          upright: string; reversed: string;
          element?: 'fire' | 'water' | 'air' | 'earth';
          keywords: string[];
        };
        reversed: boolean;
        position: string;
        reading: string;
      }>;
      summary: string;
    } }>('/api/tarot', opts),

  // ─── Phase 20 — Workflow: saved views ────────────────────────────────────
  views: {
    list: (opts: { route?: string; pinned?: boolean } = {}) => {
      const qs = new URLSearchParams();
      if (opts.route) qs.set('route', opts.route);
      if (typeof opts.pinned === 'boolean') qs.set('pinned', String(opts.pinned));
      return get<{ ok: true; views: Array<SavedView> }>(
        `/api/views${qs.toString() ? `?${qs}` : ''}`,
      );
    },
    get: (id: string) =>
      get<{ ok: true; view: SavedView }>(`/api/views/${id}`),
    create: (input: Partial<SavedView> & { name: string; route: string }) =>
      post<{ ok: true; view: SavedView }>('/api/views', input),
    update: (id: string, patch: Partial<SavedView>) =>
      // PATCH — implemented as raw fetch since the shared post() is POST-only
      rawJson<{ ok: true; view: SavedView }>(`/api/views/${id}`, 'PATCH', patch),
    delete: (id: string) =>
      rawJson<{ ok: true; deleted: boolean }>(`/api/views/${id}`, 'DELETE'),
  },

  dashboardWidgets: (birth: BirthInput, when?: string, chartLabel?: string) =>
    post<{ ok: true; snapshot: {
      at: string;
      chartLabel?: string;
      nextTransit: {
        kind: 'next-transit'; found: boolean;
        date?: string; planet?: string; planetName?: string;
        fromSign?: number; fromSignName?: string;
        toSign?: number; toSignName?: string;
        daysUntil?: number;
      };
      pratyantar: {
        kind: 'pratyantar'; found: boolean; at: string;
        maha?: { lordName: string; start: string; end: string; years: number };
        antar?: { lordName: string; start: string; end: string; years: number };
        pratyantar?: { lordName: string; start: string; end: string; years: number };
      };
      chandraBala: {
        kind: 'chandra-bala'; at: string;
        natalMoonSign: number; natalMoonSignName: string;
        transitMoonSign: number; transitMoonSignName: string;
        houseFromNatalMoon: number; favorable: boolean; note: string;
      };
    } }>('/api/widgets/dashboard', { birth, when, chartLabel }),
};

// ─── SavedView type (client-side mirror of server model) ────────────────────
export interface SavedView {
  _id?: string;
  name: string;
  route: string;
  kind?: string;
  snapshot?: any;
  tags?: string[];
  pinned?: boolean;
  chartId?: string;
  createdAt?: string;
  updatedAt?: string;
}
