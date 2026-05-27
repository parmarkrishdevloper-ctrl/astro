// Client-side translator for server-generated English strings.
//
// The Express server emits several content blocks as English template
// strings (gochara reading text, dasha sandhi commentary, daily horoscope
// bullets, etc.). Rather than translating these server-side (which would
// require touching server code and forcing a redeploy for every locale
// change), we pattern-match them here and rewrite to Hindi when the
// active locale is 'hi'.
//
// All patterns are conservative — if a pattern fails to match, the
// original English string is returned untouched. That means future
// server text changes degrade gracefully (you see English, not garbage).
//
// Currently covered:
//   • Gochara: "SU transit in house 1 from Moon — classical unfavorable gochar, caution advised"
//   • Sandhi : "Routine KE → VE junction — lighter effects expected"
//             "Hostile transition from VE to SU — classical caution: health, mind, decisions"
//             "Malefic-to-malefic junction (MA → RA) — keep major commitments outside this window"
//   • Horoscope bullets (Today / Running / Maha lord / JU/SA transits / Combust)

import type { Locale } from './index';

// ─── Planet code → Hindi label ─────────────────────────────────────────
const PLANET_HI: Record<string, string> = {
  SU: 'सूर्य', MO: 'चंद्र', MA: 'मंगल', ME: 'बुध',
  JU: 'गुरु',  VE: 'शुक्र', SA: 'शनि',  RA: 'राहु', KE: 'केतु',
};
function planetHi(code: string): string {
  return PLANET_HI[code.toUpperCase()] ?? code;
}

// Ordinal — 1st → 1ला, 2nd → 2रा etc. (Hindi: prefer simple "Nवें भाव में")
function ordHi(n: number | string): string {
  // The classical Hindi form is "Nवाँ" / "Nवें" — we use the locative "वें"
  // because every call-site is "in your Nth house" → "आपके Nवें भाव में".
  return `${n}वें`;
}

// ─── Gochara reading ───────────────────────────────────────────────────
// Format observed: "<PL> transit in house <N> from Moon — <verdict>"
const GOCHARA_RE =
  /^([A-Z]{2})\s+transit\s+in\s+house\s+(\d+)\s+from\s+Moon\s+—\s+(.+)$/i;

function translateGocharaReading(en: string): string {
  const m = en.match(GOCHARA_RE);
  if (!m) return en;
  const [, planet, houseStr, verdictRaw] = m;
  const houseN = Number(houseStr);
  const verdict = translateGocharaVerdict(verdictRaw.trim());
  return `${planetHi(planet)} चंद्र से भाव ${houseN} में गोचर — ${verdict}`;
}

function translateGocharaVerdict(v: string): string {
  const lower = v.toLowerCase();
  if (lower.includes('classical unfavorable') || lower.includes('caution advised')) {
    return 'शास्त्रीय प्रतिकूल गोचर, सावधानी उचित';
  }
  if (lower.includes('classical favorable')) {
    return 'शास्त्रीय अनुकूल गोचर';
  }
  return v;
}

// ─── Dasha Sandhi note ─────────────────────────────────────────────────
// Format observed: three distinct shapes the server emits.
const SANDHI_ROUTINE_RE =
  /^Routine\s+([A-Z]{2})\s+→\s+([A-Z]{2})\s+junction\s+—\s+lighter\s+effects\s+expected\.?$/i;
const SANDHI_HOSTILE_RE =
  /^Hostile\s+transition\s+from\s+([A-Z]{2})\s+to\s+([A-Z]{2})\s+—\s+classical\s+caution:\s*health,\s*mind,\s*decisions\.?$/i;
const SANDHI_MALEFIC_RE =
  /^Malefic-to-malefic\s+junction\s+\(([A-Z]{2})\s+→\s+([A-Z]{2})\)\s+—\s+keep\s+major\s+commitments\s+outside\s+this\s+window\.?$/i;

function translateSandhiNote(en: string): string {
  let m = en.match(SANDHI_ROUTINE_RE);
  if (m) return `नियमित ${planetHi(m[1])} → ${planetHi(m[2])} संधि — हल्के प्रभाव अपेक्षित`;
  m = en.match(SANDHI_HOSTILE_RE);
  if (m) return `प्रतिकूल ${planetHi(m[1])} → ${planetHi(m[2])} संधि — स्वास्थ्य, मन, निर्णयों में सावधानी`;
  m = en.match(SANDHI_MALEFIC_RE);
  if (m) return `पापग्रह-से-पापग्रह संधि (${planetHi(m[1])} → ${planetHi(m[2])}) — इस अवधि में बड़े निर्णय टालें`;
  return en;
}

// ─── Daily horoscope bullets ───────────────────────────────────────────
// Many shapes — handle the ones the user listed.
const HOR_TODAY_RE     = /^Today:\s+([A-Z]{2})\/([A-Z]{2})\s+focus\s+on\s+(.+?)\.?$/i;
const HOR_RUNNING_RE   = /^Running\s+(.+?)\s+period\s+—\s+(.+?)\.?$/i;
const HOR_MAHA_RE      = /^Maha\s+lord\s+sits\s+in\s+your\s+(\d+)(?:st|nd|rd|th)\s+\((.+?)\);\s*antar\s+lord\s+in\s+your\s+(\d+)(?:st|nd|rd|th)\s+\((.+?)\)\.?$/i;
const HOR_JU_TRANSIT_RE= /^JU\s+transits\s+your\s+(\d+)(?:st|nd|rd|th)\s+—\s+watch\s+(.+?)\.?$/i;
const HOR_SA_TRANSIT_RE= /^SA\s+transits\s+your\s+(\d+)(?:st|nd|rd|th)\s+—\s+watch\s+(.+?)\.?$/i;
const HOR_COMBUST_RE   = /^Combust:\s+(.+?)\s+—\s+these\s+significations\s+are\s+muffled\.?$/i;

function translateHoroscopeLine(en: string): string {
  let m: RegExpMatchArray | null;

  m = en.match(HOR_TODAY_RE);
  if (m) return `आज: ${planetHi(m[1])}/${planetHi(m[2])} — ${m[3]} पर ध्यान।`;

  m = en.match(HOR_RUNNING_RE);
  if (m) return `${m[1]} काल चल रहा है — ${m[2]}`;

  m = en.match(HOR_MAHA_RE);
  if (m) return `महादशा स्वामी आपके ${ordHi(m[1])} भाव (${m[2]}) में; अंतरदशा स्वामी ${ordHi(m[3])} भाव (${m[4]}) में।`;

  m = en.match(HOR_JU_TRANSIT_RE);
  if (m) return `गुरु आपके ${ordHi(m[1])} भाव में गोचर — ${m[2]} पर ध्यान दें।`;

  m = en.match(HOR_SA_TRANSIT_RE);
  if (m) return `शनि आपके ${ordHi(m[1])} भाव में गोचर — ${m[2]} पर ध्यान दें।`;

  m = en.match(HOR_COMBUST_RE);
  if (m) {
    // Comma-separated planet codes -> Hindi labels.
    const list = m[1].split(/[,\s]+/).filter(Boolean).map(planetHi).join(', ');
    return `अस्त: ${list} — इनके कारकत्व मंद हैं।`;
  }

  return en;
}

// ─── Public dispatcher ─────────────────────────────────────────────────
// The page passes a `kind` discriminator so we know which patterns to
// try. Each helper is a no-op when the input doesn't match.
export type ServerTextKind = 'gochara' | 'sandhi' | 'horoscope' | 'horoscope-headline';

export function translateServerText(
  text: string | null | undefined,
  kind: ServerTextKind,
  locale: Locale,
): string {
  if (!text) return text ?? '';
  if (locale !== 'hi') return text;
  switch (kind) {
    case 'gochara':           return translateGocharaReading(text);
    case 'sandhi':            return translateSandhiNote(text);
    case 'horoscope':         return translateHoroscopeLine(text);
    case 'horoscope-headline':return translateHoroscopeLine(text);
  }
}
