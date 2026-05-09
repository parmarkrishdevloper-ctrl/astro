// Shape mirrors the server responses. Kept here so the client has zero
// transitive deps on the server source. Phase 7 will move these into
// the `shared/` workspace.

export type PlanetId = 'SU' | 'MO' | 'MA' | 'ME' | 'JU' | 'VE' | 'SA' | 'RA' | 'KE';

export interface PlanetPosition {
  id: PlanetId;
  name: string;
  nameHi: string;
  longitude: number;
  speed: number;
  retrograde: boolean;
  rashi: { num: number; name: string; nameHi: string; degInRashi: number };
  nakshatra: { num: number; name: string; nameHi: string; lord: PlanetId; pada: number };
  house: number;
  exalted: boolean;
  debilitated: boolean;
  combust: boolean;
  ownSign: boolean;
}

export type ChartMode = 'sidereal' | 'tropical';

export interface ChartOptions {
  ayanamsa?: string;
  houseSystem?: string;
  tropical?: boolean;
}

export interface AyanamsaInfo { key: string; name: string; description: string }
export interface HouseSystemInfo { key: string; code: string; name: string; description: string }

export interface KundaliResult {
  input: {
    datetime: string;
    tzOffsetHours?: number;
    lat: number;
    lng: number;
    placeName?: string;
    options?: ChartOptions;
  };
  utc: string;
  jd: number;
  ayanamsa: { name: string; valueDeg: number; mode: ChartMode };
  houseSystem: string;
  ascendant: {
    longitude: number;
    rashi: { num: number; name: string; nameHi: string; degInRashi: number };
    nakshatra: { num: number; name: string; nameHi: string; lord: PlanetId; pada: number };
  };
  houses: {
    num: number;
    rashiNum: number;
    rashiName: string;
    lord: PlanetId;
    cuspLongitude: number;
  }[];
  planets: PlanetPosition[];
}

export type DashaLevel =
  | 'maha' | 'antar' | 'pratyantar'
  | 'sookshma' | 'prana' | 'deha';

export type DashaSystemKey =
  | 'vimshottari' | 'yogini' | 'ashtottari'
  | 'shodasottari' | 'dwadashottari' | 'panchottari'
  | 'shatabdika'   | 'naisargika'    | 'kalachakra';

export interface DashaLordSpec {
  lord: PlanetId;
  years: number;
  displayName?: string;
  displayNameHi?: string;
}

export interface DashaSystemMeta {
  key: DashaSystemKey;
  name: string;
  nameHi: string;
  totalYears: number;
  order: DashaLordSpec[];
  purpose: string;
  condition?: string;
}

export interface DashaPeriod {
  lord: PlanetId;
  lordName: string;
  start: string;
  end: string;
  years: number;
  level: DashaLevel;
  systemKey?: DashaSystemKey;
  lordDisplayName?: string;
  lordDisplayNameHi?: string;
  antardashas?: DashaPeriod[];
}

export interface DashaStartInfo {
  system: DashaSystemKey;
  startingLord: PlanetId;
  startingLordYears: number;
  balanceYears: number;
  elapsedFraction: number;
  note?: string;
}

export interface DeepDashaSnapshot {
  at: string;
  systemKey: DashaSystemKey;
  maha: DashaPeriod | null;
  antar: DashaPeriod | null;
  pratyantar: DashaPeriod | null;
  sookshma: DashaPeriod | null;
  prana: DashaPeriod | null;
  deha: DashaPeriod | null;
}

export interface SubdivideResult {
  level: DashaLevel | null;
  parent: DashaPeriod | null;
  ancestry?: DashaPeriod[];
  children: DashaPeriod[];
  levels?: DashaLevel[];
  system?: DashaSystemKey;
}

export interface VimshottariResult {
  birthMoonLongitude: number;
  startNakshatra: { num: number; name: string; lord: PlanetId };
  mahadashas: DashaPeriod[];
}

export interface BirthInput {
  datetime: string;
  tzOffsetHours?: number;
  lat: number;
  lng: number;
  placeName?: string;
  name?: string;
  options?: ChartOptions;
}

// ─── PHASE 8 — Jaimini rashi-based dashas ──────────────────────────────────

export interface JaiminiRashiDashaPeriod {
  signNum: number;
  signName: string;
  years: number;
  startDate: string;
  endDate: string;
}

export type JaiminiDashaKey = 'chara' | 'sthira' | 'narayana' | 'shoola' | 'niryanaShoola' | 'padakrama';

export interface JaiminiDashasBundle {
  chara: JaiminiRashiDashaPeriod[];
  sthira: JaiminiRashiDashaPeriod[];
  narayana: JaiminiRashiDashaPeriod[];
  shoola: JaiminiRashiDashaPeriod[];
  /** Phase 9 — deep Jaimini */
  niryanaShoola: JaiminiRashiDashaPeriod[];
  padakrama: JaiminiRashiDashaPeriod[];
}

// ─── PHASE 4 TYPES ──────────────────────────────────────────────────────────

export type KootKey =
  | 'Varna' | 'Vashya' | 'Tara' | 'Yoni'
  | 'Graha Maitri' | 'Gana' | 'Bhakoot' | 'Nadi';

export interface KootScore {
  /** Localised display name. */
  name: string;
  /** Stable English key — use with `al.kootName(kootKey)` if you need to
   * re-render the name in another locale. */
  kootKey: KootKey;
  obtained: number;
  max: number;
  detail: string;
  description: string;
}

export interface PersonProfile {
  /** English rashi name; client maps via `al.rashiByName(rashi)`. Or use
   * `al.rashi(rashiNum)` directly. */
  rashi: string;
  rashiNum: number;
  rashiLord: PlanetId;
  /** English nakshatra name; use `al.nakshatra(nakNum)`. */
  nakshatra: string;
  nakNum: number;
  nakLord: PlanetId;
  pada: number;
  /** Localised varna name. */
  varna: string;
  /** Localised vashya name. */
  vashya: string;
  /** Localised yoni name. */
  yoni: string;
  /** Localised gana name. */
  gana: string;
  /** Localised nadi name. */
  nadi: string;
  /** Planet id — client renders via `al.planet(currentDasha)`. */
  currentDasha: PlanetId;
  /** English ascendant rashi name; client maps via `al.rashiByName`. */
  ascendantRashi: string;
  moonLongitude: number;
  marsHouse: number;
}

export interface ManglikSide {
  isManglik: boolean;
  marsHouse: number;
  /** English rashi name. */
  marsRashi: string;
  /** Already localised. */
  cancellations: string[];
  netManglik: boolean;
}

export interface ExtraDosha {
  /** Stable English key — `al.extraDosha(name)` localises. */
  name: string;
  /** Localised display name. */
  nameLabel: string;
  present: boolean;
  /** Localised note. */
  note: string;
}

export interface MatchingResult {
  boy: PersonProfile;
  girl: PersonProfile;
  koots: KootScore[];
  total: { obtained: number; max: number; percentage: number };
  /** Localised verdict prose. */
  verdict: string;
  verdictTone: 'excellent' | 'good' | 'acceptable' | 'poor';
  manglik: {
    boy: ManglikSide;
    girl: ManglikSide;
    compatible: boolean;
    /** Localised note. */
    note: string;
  };
  nadiDosha: { present: boolean; cancelled: boolean; reasons: string[]; netDosha: boolean };
  bhakootDosha: { present: boolean; cancelled: boolean; reasons: string[]; netDosha: boolean };
  extras: ExtraDosha[];
  /** Localised counsel. */
  recommendations: string[];
}

export interface TimeRange { start: string; end: string }

export interface PanchangResult {
  date: string;
  lat: number;
  lng: number;
  vara: { num: number; name: string; lord: string; dishaShool: string };
  tithi: {
    num: number; name: string; paksha: string;
    elapsedFraction: number; endsAt: string | null; nextName: string;
  };
  nakshatra: {
    num: number; name: string; nameHi?: string; lord: string; pada: number;
    deity: string; gana: string; yoni: string; varna: string; nadi: string;
    endsAt: string | null; nextName: string;
  };
  yoga:   { num: number; name: string; endsAt: string | null; nextName: string };
  karana: { num: number; name: string; endsAt: string | null; nextName: string };
  sun: { longitude: number; rashi: string; rashiNum: number; degInRashi: number; nakshatra: string };
  moon: { longitude: number; rashi: string; rashiNum: number; degInRashi: number; nakshatra: string };
  ayana: 'Uttarayana' | 'Dakshinayana';
  ritu: string;
  masa: { amanta: string; purnimanta: string };
  samvat: { vikram: number; shaka: number; kali: number };
  sunrise: string | null;
  sunset: string | null;
  moonrise: string | null;
  moonset: string | null;
  brahmaMuhurat: TimeRange | null;
  abhijitMuhurat: TimeRange | null;
  godhuliMuhurat: TimeRange | null;
  amritKaal: TimeRange | null;
  pratahSandhya: TimeRange | null;
  sayamSandhya: TimeRange | null;
  rahuKaal: TimeRange | null;
  gulika: TimeRange | null;
  yamaghanda: TimeRange | null;
  varjyam: TimeRange | null;
  durMuhurtam: TimeRange[];
  chandraBalaRashis: number[];
  taraBalaFavorable: number[];
  taraBalaInauspicious: number[];
}

export interface YogaResult {
  name: string;
  type: 'Mahapurusha' | 'Raja' | 'Dhana' | 'Lunar' | 'Other';
  involves: PlanetId[];
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface MangalDoshaResult {
  hasDosha: boolean;
  fromLagna: boolean;
  fromMoon: boolean;
  fromVenus: boolean;
  marsHouse: { fromLagna: number; fromMoon: number; fromVenus: number };
  cancelled: boolean;
  cancellationReasons: string[];
}
export interface KaalSarpaResult {
  hasDosha: boolean;
  /** Stable English key (e.g. 'Anant') — use `al.kaalSarpaType(type)` to
   * localise. Null when there is no dosha. */
  type: string | null;
  /** Localised display label. Null when there is no dosha. */
  typeLabel: string | null;
  partial: boolean;
}
export interface SadeSatiResult {
  active: boolean;
  phase: 'first' | 'peak' | 'last' | null;
  phaseDescription: string;
  saturnRashi: number;
  moonRashi: number;
  housesFromMoon: number;
}
export interface AllDoshasResult {
  mangal: MangalDoshaResult;
  kaalSarpa: KaalSarpaResult;
  sadeSati: SadeSatiResult;
}

export interface PlanetStrength {
  planet: PlanetId;
  components: {
    sthana: number;
    dig: number;
    kala: number;
    cheshta: number;
    naisargika: number;
    drik: number;
  };
  totalVirupas: number;
  totalRupas: number;
  category: 'very strong' | 'strong' | 'moderate' | 'weak';
}
export interface ShadbalaResult {
  planets: PlanetStrength[];
  strongest: PlanetId;
  weakest: PlanetId;
}

export interface NumerologyProfile {
  number: number;
  rulingPlanet: string;
  personality: string;
  luckyColors: string[];
  luckyDays: string[];
  luckyNumbers: number[];
  luckyGem: string;
}
export interface NumerologyResult {
  moolank: NumerologyProfile;
  bhagyank: NumerologyProfile;
  nameNumber?: NumerologyProfile & { rawSum: number };
}

export type MuhuratEvent =
  | 'marriage' | 'griha-pravesh' | 'travel' | 'business'
  | 'education' | 'vehicle-purchase' | 'general';

export interface MuhuratWindow {
  start: string;
  end: string;
  score: number;
  reasons: string[];
  warnings: string[];
  panchangSnapshot: { tithi: string; nakshatra: string; vara: string; yoga: string };
}
export interface MuhuratResult {
  event: MuhuratEvent;
  windows: MuhuratWindow[];
  totalCandidatesEvaluated: number;
}

// ─── DIVISIONAL CHARTS (Phase 8a) ────────────────────────────────────────────

export type Varga =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9'
  | 'D10' | 'D11' | 'D12' | 'D16' | 'D20' | 'D24' | 'D27' | 'D30'
  | 'D40' | 'D45' | 'D60';

export interface VargaMeta {
  varga: Varga;
  name: string;
  nameHi: string;
  segments: number;
  segmentDeg: number;
  purpose: string;
}

export type Dignity = 'Exalted' | 'Debilitated' | 'OwnSign' | '';

export interface DivisionalPosition {
  id: PlanetId;
  name: string;
  rashi: number;
  rashiName: string;
  rashiNameHi: string;
  house: number;
  dignity: Dignity;
  vargottama: boolean;
}

export interface DivisionalChart {
  varga: Varga;
  meta: VargaMeta;
  ascendantRashi: number;
  ascendantRashiName: string;
  positions: DivisionalPosition[];
}

export interface VargaSummaryRow {
  id: PlanetId;
  name: string;
  vargottamaCount: number;
  exaltedCount: number;
  debilitatedCount: number;
  ownSignCount: number;
  details: { varga: Varga; rashi: number; rashiName: string; dignity: Dignity; vargottama: boolean }[];
}

export interface PlanetRemedy {
  planet: PlanetId;
  name: string;
  nameHi: string;
  deity: string;
  day: string;
  direction: string;
  color: string;
  gem: { primary: string; substitutes: string[] };
  bijaMantra: string;
  vedicMantra: string;
  japaCount: number;
  charity: string[];
  fastingDay: string;
}
export interface DoshaRemedy {
  dosha: string;
  summary: string;
  steps: string[];
  mantra?: string;
}
export interface RemedySuggestion {
  planet: PlanetId;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  remedy: PlanetRemedy;
}
export interface RemedyResult {
  planets: Record<PlanetId, PlanetRemedy>;
  suggestions: RemedySuggestion[];
  doshaRemedies: DoshaRemedy[];
  general: string[];
}

export interface IshtaKashtaRow {
  planet: PlanetId;
  uchchaBala: number;
  cheshtaBala: number;
  ishta: number;
  kashta: number;
  ishtaRupa: number;
  kashtaRupa: number;
  netResult: 'Auspicious' | 'Mixed' | 'Inauspicious';
}
export interface IshtaKashtaResult {
  rows: IshtaKashtaRow[];
  mostAuspicious: PlanetId;
  mostInauspicious: PlanetId;
}

export type VimsopakaScheme = 'shad' | 'sapta' | 'dasha' | 'shodasha';
export type VimsopakaDignity =
  | 'Exalted' | 'Own' | 'Vargottama'
  | 'Friend' | 'Neutral' | 'Enemy' | 'Debilitated';

export interface VimsopakaSchemeInfo {
  key: VimsopakaScheme;
  name: string;
  nameHi: string;
  purpose: string;
  vargas: string[];
}

export interface VimsopakaVargaCell {
  varga: Varga;
  rashi: number;
  rashiName: string;
  dignity: VimsopakaDignity;
  points: number;
  weight: number;
  contribution: number;
  vargottama: boolean;
}

export interface VimsopakaPlanetRow {
  planet: PlanetId;
  scheme: VimsopakaScheme;
  cells: VimsopakaVargaCell[];
  total: number;
  category: 'Purna' | 'Uttama' | 'Gopura' | 'Simhasana' | 'Paravata' | 'Iravata';
}

export interface VimsopakaResult {
  scheme: VimsopakaScheme;
  meta: {
    key: VimsopakaScheme;
    name: string;
    nameHi: string;
    totalWeight: 20;
    weights: Partial<Record<Varga, number>>;
    purpose: string;
  };
  rows: VimsopakaPlanetRow[];
  strongest: PlanetId;
  weakest: PlanetId;
}

// ─── PHASE 11 — Varshaphala (Tajaka / Annual horoscope) ─────────────────────

export interface Saham {
  key: string;
  name: string;
  longitude: number;
  signNum: number;
  signName: string;
}

export type TajikaAspect =
  | 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export interface TajikaSambandha {
  a: PlanetId;
  b: PlanetId;
  aspect: TajikaAspect;
  orb: number;
  allowed: number;
  relation: 'Itthasala' | 'Ishraaf' | 'Manahu';
  applying: boolean;
  faster: PlanetId;
  slower: PlanetId;
}

export interface TajikaTransfer {
  kind: 'Nakta' | 'Yamaya';
  a: PlanetId;
  b: PlanetId;
  via: PlanetId;
}

export interface TajikaResult {
  sambandhas: TajikaSambandha[];
  transfers: TajikaTransfer[];
  summary: {
    itthasala: number;
    ishraaf: number;
    manahu: number;
    nakta: number;
    yamaya: number;
  };
}

export interface VarshaphalaResult {
  age: number;
  natal: { datetime: string; jd: number };
  varshaMomentUTC: string;
  varshaJD: number;
  chart: KundaliResult;
  muntha: { signNum: number; signName: string; lord: PlanetId };
  varshesha: PlanetId;
  sahams: Saham[];
  yogi: { point: number; signNum: number; nakLord: PlanetId; rashiLord: PlanetId };
  avayogi: { nakLord: PlanetId };
  duplicateYogi: PlanetId;
  tripataki: { nakshatras: Array<{ num: number; flag: 'flag1' | 'flag2' | 'flag3' }> };
  masaPhala: Array<{ month: number; startDate: string; endDate: string; munthaSign: number; moonSign: number }>;
  /** Phase 9 — Tajika sambandhas (Itthasala/Ishraaf/Manahu) + transfers (Nakta/Yamaya) */
  tajika: TajikaResult;
}

export interface MuddaPeriod {
  lord: PlanetId;
  days: number;
  startDate: string;
  endDate: string;
}

// ─── PHASE 19 — Ashtakavarga (BAV + SAV + shodhita reductions) ─────────────

export interface BAV {
  reference: PlanetId;
  /** points per sign (index 0 = Aries, 11 = Pisces) */
  points: number[];
  total: number;
}

export interface SAV {
  points: number[];
  total: number;
}

export interface AshtakavargaResult {
  bav: Record<PlanetId, BAV>;
  sav: SAV;
  trikonaShodhita: Record<PlanetId, BAV>;
  ekadhipatyaShodhita: Record<PlanetId, BAV>;
}

// ─── PHASE 18 — Interpretation + Classical references ─────────────────────

export type ClassicalSource =
  | 'BPHS' | 'Saravali' | 'Hora Sara' | 'Garga Hora'
  | 'Phaladeepika' | 'Jataka Parijata';

export interface ClassicalRef {
  id: string;
  source: ClassicalSource;
  chapter: string;
  sloka?: string;
  topic: string;
  text: string;
  tags: string[];
}

export interface InterpretationLine {
  topic: string;
  text: string;
  refs: ClassicalRef[];
}

export interface FullInterpretation {
  ascendant: InterpretationLine;
  planetsInHouses: InterpretationLine[];
  planetsInSigns: InterpretationLine[];
  houseLordPlacements: InterpretationLine[];
}

// ─── PHASE 17 — Worksheet PDF bundles ──────────────────────────────────────

export type WorksheetSectionId =
  | 'birth' | 'planets' | 'vimshottari' | 'ashtakavarga' | 'shadbala'
  | 'yogas' | 'interpretation' | 'remedies' | 'jaimini' | 'kp'
  | 'avasthas' | 'sudarshana' | 'varshaphala' | 'transits'
  | 'chalit' | 'upagrahas' | 'sensitivePoints';

export interface WorksheetBundle {
  id: string;
  title: string;
  sections: WorksheetSectionId[];
}

// ─── PHASE 16 — Ephemeris (tabular + graphical) ─────────────────────────────

export interface EphemerisPlanetPosition {
  longitude: number;
  signNum: number;
  sign: string;
  retrograde: boolean;
}

export interface EphemerisRow {
  date: string;
  positions: Record<PlanetId, EphemerisPlanetPosition>;
}

export interface GraphicalEphemerisPoint {
  x: number;
  y: number;
  retrograde: boolean;
}

export interface GraphicalEphemerisSeries {
  planet: PlanetId;
  points: GraphicalEphemerisPoint[];
}

// ─── PHASE 15 — Sudarshana Chakra + Avasthas ────────────────────────────────

export type SudarshanaReference = 'Lagna' | 'Moon' | 'Sun';

export interface SudarshanaCell {
  house: number;
  signNum: number;
  signName: string;
  planets: PlanetId[];
}

export interface SudarshanaRing {
  reference: SudarshanaReference;
  refSignNum: number;
  cells: SudarshanaCell[];
}

export interface SudarshanaDashaRow {
  year: number;
  ring: SudarshanaReference;
  house: number;
  signNum: number;
}

export interface SudarshanaResult {
  rings: SudarshanaRing[];
  dasha: SudarshanaDashaRow[];
}

export type BaladiState = 'Bala' | 'Kumara' | 'Yuva' | 'Vriddha' | 'Mrita';
export type JagradadiState = 'Jagrat' | 'Swapna' | 'Sushupti';
export type DeeptadiState =
  | 'Deepta' | 'Swastha' | 'Mudita' | 'Shanta'
  | 'Deena'  | 'Vikala'  | 'Dukhita' | 'Khala';

export interface AvasthaEntry {
  planet: PlanetId;
  baladi: BaladiState;
  jagradadi: JagradadiState;
  deeptadi: DeeptadiState;
}

// ─── PHASE 14 — Event prediction + auspiciousness ───────────────────────────

export type EventProbability = 'High' | 'Medium' | 'Low';

export interface EventWindow {
  start: string;
  end: string;
  category: string;
  label: string;
  probability: EventProbability;
  dasha: string;
  reason: string;
}

export interface AuspiciousnessPoint {
  date: string;
  score: number;
  dasha: string;
}

// ─── PHASE 13 — Rectification (birth-time) ──────────────────────────────────

export interface RectificationEventInput {
  date: string;
  house: number;
  weight?: number;
}

export interface RectificationCandidate {
  datetimeISO: string;
  score: number;
  matchedEvents: number;
}

export interface RectificationResult {
  bestMatch: RectificationCandidate;
  candidates: RectificationCandidate[];
}

// ─── PHASE 12 — Prashna (Horary astrology) ──────────────────────────────────

export type PrashnaMode = 'time' | 'number';

export type PrashnaCategory =
  | 'marriage' | 'career' | 'health' | 'progeny' | 'property'
  | 'travel'   | 'litigation' | 'finance' | 'education';

export type PrashnaVerdict = 'yes' | 'no' | 'mixed';

export interface PrashnaResult {
  mode: PrashnaMode;
  question?: string;
  whenUTC: string;
  chart: KundaliResult;
  ascendantLords?: { sign: string; star: string; sub: string };
}

export interface PrashnaAnalysisRow {
  source: 'Ascendant' | 'Moon' | 'Primary house';
  sublord: PlanetId;
  signifiesHouses: number[];
  positiveHit: boolean;
  destroyerHit: boolean;
}

export interface PrashnaVerdictResult {
  category: PrashnaCategory;
  categoryLabel: string;
  primaryHouse: number;
  analysis: PrashnaAnalysisRow[];
  rulingPlanets: PlanetId[];
  verdict: PrashnaVerdict;
  confidence: number;
  reasoning: string;
}

// ─── PHASE 10 — Predictive precision ────────────────────────────────────────

export interface GocharaRow {
  planet: PlanetId;
  transitSign: number;
  transitSignName: string;
  houseFromMoon: number;
  isFavorable: boolean;
  isUnfavorable: boolean;
  vedhaActive: boolean;
  vedhaBy: PlanetId | null;
  vedhaNote: string | null;
  netResult: 'favorable' | 'cancelled' | 'unfavorable' | 'neutral';
  interpretation: string;
}
export interface GocharaResult {
  whenUTC: string;
  moonSign: number;
  rows: GocharaRow[];
}

export interface SandhiWindow {
  level: 'maha' | 'antar';
  outgoingLord: PlanetId;
  incomingLord: PlanetId;
  outgoingStart: string;
  sandhiStart: string;
  junctionAt: string;
  sandhiEnd: string;
  incomingEnd: string;
  totalDays: number;
  severity: 'high' | 'medium' | 'low';
  note: string;
}
export interface SandhiResult {
  from: string;
  to: string;
  marginPct: number;
  windows: SandhiWindow[];
}

export interface AshtakavargaTransitRow {
  planet: PlanetId;
  transitSign: number;
  transitSignName: string;
  ownBindus: number;
  sarvaBindus: number;
  strengthScore: number;
  verdict: 'very strong' | 'strong' | 'moderate' | 'weak' | 'very weak';
  interpretation: string;
}
export interface AshtakavargaTransitResult {
  whenUTC: string;
  natalSAVTotal: number;
  rows: AshtakavargaTransitRow[];
}

export interface DoubleTransitEvent {
  date: string;
  jupiterSign: number;
  saturnSign: number;
  houseFromLagna: number[];
  houseFromMoon: number[];
  activatedTopics: string[];
}
export interface DoubleTransitResult {
  natalMoonSign: number;
  natalLagnaSign: number;
  from: string;
  to: string;
  events: DoubleTransitEvent[];
}

export interface Branding {
  companyName: string;
  tagline?: string;
  logoDataUrl?: string;
  primaryColor: string;
  accentColor: string;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  footerText?: string;
}

// ─── Phase 10 — Predictive precision ──────────────────────────────────────

export type SadeSatiPhase = 'Rising' | 'Peak' | 'Setting' | 'Ashtami' | 'Kantak';

export interface SadeSatiKakshya {
  index: number;
  lord: PlanetId;
  startDeg: number;
  endDeg: number;
  startUTC: string;
  endUTC: string;
}
export interface SadeSatiSignSegment {
  phase: SadeSatiPhase;
  signNum: number;
  signName: string;
  fromMoonHouse: number;
  entryUTC: string;
  exitUTC: string;
  kakshyas: SadeSatiKakshya[];
}
export interface SadeSatiCycle {
  cycle: number;
  label: string;
  startUTC: string;
  endUTC: string;
  segments: SadeSatiSignSegment[];
}
export interface SadeSatiTimeline {
  moonSignNum: number;
  moonSignName: string;
  targetSigns: { phase: SadeSatiPhase; signNum: number; signName: string; fromMoonHouse: number }[];
  active: {
    phase: SadeSatiPhase | null;
    saturnSignNum: number;
    saturnHouseFromMoon: number;
    currentKakshya: number | null;
    currentKakshyaLord: PlanetId | null;
  };
  cycles: SadeSatiCycle[];
  ashtami: SadeSatiSignSegment[];
  kantak: SadeSatiSignSegment[];
}

export type ReturnPlanet = 'SA' | 'JU' | 'SU' | 'MO' | 'RA';

export interface PlanetaryReturn {
  planet: ReturnPlanet;
  occurrence: number;
  returnUTC: string;
  natalLongitude: number;
  signName: string;
  degInSign: number;
  nakshatraName: string;
  nakshatraPada: number;
  ageYearsAtReturn: number;
}

export interface ReturnsBundle {
  natalLongitudes: Record<ReturnPlanet, number>;
  saturn: PlanetaryReturn[];
  jupiter: PlanetaryReturn[];
  solar: PlanetaryReturn[];
  lunar: PlanetaryReturn[];
  rahu: PlanetaryReturn[];
}

export interface ProgressedPlanet {
  id: PlanetId;
  longitude: number;
  signNum: number;
  signName: string;
  degInSign: number;
  nakshatraName: string;
  nakshatraPada: number;
  retrograde: boolean;
  natalHouseNow: number;
  delta: number;
}
export interface ProgressedAspect {
  a: PlanetId;
  b: PlanetId;
  kind: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  exactDeg: number;
  orb: number;
}
export interface ProgressionsBundle {
  ageYears: number;
  progressedDateUTC: string;
  progressedAscendant: number;
  progressedAscendantSign: string;
  planets: ProgressedPlanet[];
  aspectsToNatal: ProgressedAspect[];
}

export interface GrahaYuddhaEvent {
  pair: [PlanetId, PlanetId];
  startUTC: string;
  peakUTC: string;
  endUTC: string;
  peakOrb: number;
  signName: string;
  winner: PlanetId;
  loser: PlanetId;
  verdict: string;
}
export interface GrahaYuddhaBundle {
  fromUTC: string;
  toUTC: string;
  events: GrahaYuddhaEvent[];
}

export interface CombustionWindow {
  planet: PlanetId;
  orb: number;
  startUTC: string;
  exactUTC: string;
  endUTC: string;
  peakSeparation: number;
  signName: string;
  durationDays: number;
  retrogradeAtStart: boolean;
}
export interface CombustionBundle {
  fromUTC: string;
  toUTC: string;
  windows: CombustionWindow[];
}

export interface RetroCycle {
  planet: PlanetId;
  preShadowStartUTC: string;
  stationRetrogradeUTC: string;
  stationDirectUTC: string;
  postShadowEndUTC: string;
  stationRetrogradeDeg: number;
  stationDirectDeg: number;
  shadowArcDeg: number;
  retrogradeArcDeg: number;
  signAtStationR: string;
  signAtStationD: string;
}
export interface RetroShadowBundle {
  fromUTC: string;
  toUTC: string;
  cycles: RetroCycle[];
}

export type KakshyaContributor = PlanetId | 'AS';
export interface KakshyaOccupancy {
  planet: PlanetId;
  signName: string;
  longitude: number;
  kakshyaIndex: number;
  kakshyaLord: KakshyaContributor;
  degInKakshya: number;
  kakshaBala: number;
  contributors: { by: KakshyaContributor; gives: boolean }[];
}
export interface KakshaBalaBundle {
  rows: KakshyaOccupancy[];
  summary: { planet: PlanetId; bala: number; rank: number }[];
}

export interface PredictiveBundle {
  sadeSati: SadeSatiTimeline;
  returns: ReturnsBundle;
  progressions: ProgressionsBundle;
  grahaYuddha: GrahaYuddhaBundle;
  combustion: CombustionBundle;
  retroShadow: RetroShadowBundle;
  kakshaBala: KakshaBalaBundle;
}
