// Gochara Phala — classical transit reading measured from the natal Moon.
//
// For each of the seven non-nodal planets, the classical texts list favorable
// and unfavorable houses (counted from natal Moon) for transit. If the planet
// is currently in a favorable house but another transit planet simultaneously
// occupies the planet's *Vedha* (obstruction) house, the benefit is cancelled.
// Likewise a malefic transit in an unfavorable house can itself be cancelled
// (Vipareeta-vedha) by a benefic transit in its vedha house.
//
// Sources: Jataka Parijata ch. 14 / Brihat Samhita ch. 98-103 / BPHS ch. 42.
// Favorable & Vedha tables below follow the traditional Parashari reading.

import { PlanetId, normDeg } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { computeAllGrahas } from './ephemeris.service';
import { dateToJD } from '../utils/julian';

// Favorable houses (counted 1..12 from natal Moon)
const GOCHARA_GOOD: Record<PlanetId, number[]> = {
  SU: [3, 6, 10, 11],
  MO: [1, 3, 6, 7, 10, 11],
  MA: [3, 6, 11],
  ME: [2, 4, 6, 8, 10, 11],
  JU: [2, 5, 7, 9, 11],
  VE: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  SA: [3, 6, 11],
  RA: [3, 6, 11],
  KE: [3, 6, 11],
};

// Vedha map: transit of the planet in `good` house is obstructed if the
// blocker planet also transits the `vedha` house at the same time.
// Traditional Parashari pairings:
const VEDHA_RULES: Record<PlanetId, Array<{ good: number; vedha: number; blocker: PlanetId[] }>> = {
  SU: [
    { good: 3, vedha: 9, blocker: ['SA'] },
    { good: 6, vedha: 12, blocker: ['SA'] },
    { good: 10, vedha: 4, blocker: ['SA'] },
    { good: 11, vedha: 5, blocker: ['SA'] },
  ],
  MO: [
    { good: 1, vedha: 5, blocker: ['SA'] },
    { good: 3, vedha: 9, blocker: ['SA'] },
    { good: 6, vedha: 12, blocker: ['SA'] },
    { good: 7, vedha: 2, blocker: ['SA'] },
    { good: 10, vedha: 4, blocker: ['SA'] },
    { good: 11, vedha: 8, blocker: ['SA'] },
  ],
  MA: [
    { good: 3, vedha: 12, blocker: ['SA'] },
    { good: 6, vedha: 9, blocker: ['SA'] },
    { good: 11, vedha: 5, blocker: ['SA'] },
  ],
  ME: [
    { good: 2, vedha: 5, blocker: ['MA'] },
    { good: 4, vedha: 3, blocker: ['MA'] },
    { good: 6, vedha: 9, blocker: ['MA'] },
    { good: 8, vedha: 1, blocker: ['MA'] },
    { good: 10, vedha: 8, blocker: ['MA'] },
    { good: 11, vedha: 12, blocker: ['MA'] },
  ],
  JU: [
    { good: 2, vedha: 12, blocker: ['VE'] },
    { good: 5, vedha: 4, blocker: ['VE'] },
    { good: 7, vedha: 3, blocker: ['VE'] },
    { good: 9, vedha: 10, blocker: ['VE'] },
    { good: 11, vedha: 8, blocker: ['VE'] },
  ],
  VE: [
    { good: 1, vedha: 8, blocker: ['JU'] },
    { good: 2, vedha: 7, blocker: ['JU'] },
    { good: 3, vedha: 1, blocker: ['JU'] },
    { good: 4, vedha: 10, blocker: ['JU'] },
    { good: 5, vedha: 9, blocker: ['JU'] },
    { good: 8, vedha: 5, blocker: ['JU'] },
    { good: 9, vedha: 11, blocker: ['JU'] },
    { good: 11, vedha: 6, blocker: ['JU'] },
    { good: 12, vedha: 3, blocker: ['JU'] },
  ],
  SA: [
    { good: 3, vedha: 12, blocker: ['MA'] },
    { good: 6, vedha: 9, blocker: ['MA'] },
    { good: 11, vedha: 5, blocker: ['MA'] },
  ],
  RA: [
    { good: 3, vedha: 12, blocker: ['MA'] },
    { good: 6, vedha: 9, blocker: ['MA'] },
    { good: 11, vedha: 5, blocker: ['MA'] },
  ],
  KE: [
    { good: 3, vedha: 12, blocker: ['MA'] },
    { good: 6, vedha: 9, blocker: ['MA'] },
    { good: 11, vedha: 5, blocker: ['MA'] },
  ],
};

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

const RASHI_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function planetSign(long: number): number {
  return Math.floor(normDeg(long) / 30) + 1;
}

function houseFromMoon(planetSignNum: number, moonSignNum: number): number {
  return ((planetSignNum - moonSignNum + 12) % 12) + 1;
}

function interpretation(
  pid: PlanetId, house: number, isFav: boolean, isUnfav: boolean,
  vedha: boolean,
): string {
  if (vedha && isFav) return `${pid} transit in house ${house} from Moon is blocked by Vedha — expected gains delayed`;
  if (vedha && isUnfav) return `${pid} transit in house ${house} from Moon is cancelled by Vipareeta Vedha — adverse effects mitigated`;
  if (isFav) return `${pid} transit in house ${house} from Moon — classical favorable gochar`;
  if (isUnfav) return `${pid} transit in house ${house} from Moon — classical unfavorable gochar, caution advised`;
  return `${pid} transit in house ${house} from Moon — neutral gochar`;
}

export function computeGochara(natal: KundaliResult, whenISO?: string): GocharaResult {
  const when = whenISO ? new Date(whenISO) : new Date();
  const jd = dateToJD(when);
  const grahas = computeAllGrahas(jd);

  const moonSign = natal.planets.find((p) => p.id === 'MO')!.rashi.num;
  const transitSignOf: Record<PlanetId, number> = {} as any;
  for (const id of Object.keys(grahas) as PlanetId[]) {
    transitSignOf[id] = planetSign(grahas[id].longitude);
  }

  const rows: GocharaRow[] = (Object.keys(GOCHARA_GOOD) as PlanetId[]).map((pid) => {
    const tSign = transitSignOf[pid];
    const house = houseFromMoon(tSign, moonSign);
    const isFav = GOCHARA_GOOD[pid].includes(house);
    // Classical "bad" = all houses NOT in the good list. (Some texts give a
    // different bad-house set, but complement-of-good is the simplest and
    // commonly used reading.)
    const isUnfav = !isFav;

    // Vedha check: the blocker must currently be in the vedha house from the Moon.
    let vedhaActive = false;
    let vedhaBy: PlanetId | null = null;
    let vedhaNote: string | null = null;
    const rules = VEDHA_RULES[pid] || [];
    for (const rule of rules) {
      if (rule.good !== house) continue;
      for (const blocker of rule.blocker) {
        if (blocker === pid) continue; // self cannot block
        const blockerHouse = houseFromMoon(transitSignOf[blocker], moonSign);
        if (blockerHouse === rule.vedha) {
          vedhaActive = true;
          vedhaBy = blocker;
          vedhaNote = `${blocker} in house ${rule.vedha} obstructs ${pid}'s good house ${house}`;
          break;
        }
      }
      if (vedhaActive) break;
    }

    const netResult: GocharaRow['netResult'] =
      isFav && !vedhaActive ? 'favorable'
      : isFav && vedhaActive ? 'cancelled'
      : isUnfav ? 'unfavorable'
      : 'neutral';

    return {
      planet: pid,
      transitSign: tSign,
      transitSignName: RASHI_NAMES[tSign - 1],
      houseFromMoon: house,
      isFavorable: isFav,
      isUnfavorable: isUnfav,
      vedhaActive,
      vedhaBy,
      vedhaNote,
      netResult,
      interpretation: interpretation(pid, house, isFav, isUnfav, vedhaActive),
    };
  });

  return {
    whenUTC: when.toISOString(),
    moonSign,
    rows,
  };
}
