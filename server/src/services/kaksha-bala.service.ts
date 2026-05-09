// Kaksha Bala — fine-grained ashtakavarga strength by 3.75° segment.
//
// Each 30° sign is sub-divided into 8 kakshyas of 3.75° each. The Kakshya
// Prastara (standard Parashari) places the 8 ashtakavarga contributors
// (SA JU MA SU VE ME MO AS) over these 8 slots in a fixed order. A planet
// transiting a kakshya is said to carry the "mini-bindus" for only those
// contributors whose BAV bindu at its current rashi is positive AND whose
// kakshya it currently occupies. The sum = Kaksha Bala.
//
// For the natal chart we answer: for each planet, which kakshya is it in,
// who rules it, and what is its kaksha-bala score (0..8). We derive BAV
// bindus from the classical sign-contribution tables defined inline.

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';

// Contributor order for the kakshya prastara (the 8 "houses" of a kakshya)
type Contributor = PlanetId | 'AS';
const KAKSHA_ORDER: Contributor[] = ['SA', 'JU', 'MA', 'SU', 'VE', 'ME', 'MO', 'AS'];
const KAKSHYA_SPAN = 30 / 8;  // 3.75°

// Classical Parashari BAV rashi-distance contribution tables.
// Each entry is: contributor → list of 1-based house-distances-from-self
// where the contributor gives a bindu to the subject planet.
// (BPHS ch. 66–67 — standard tables.) Encoded here for self-contained
// kaksha-bala without pulling in a full Ashtakavarga service.
const BAV_RULES: Record<PlanetId, Record<Contributor, number[]>> = {
  SU: {
    SU: [1, 2, 4, 7, 8, 9, 10, 11],
    MO: [3, 6, 10, 11],
    MA: [1, 2, 4, 7, 8, 9, 10, 11],
    ME: [3, 5, 6, 9, 10, 11, 12],
    JU: [5, 6, 9, 11],
    VE: [6, 7, 12],
    SA: [1, 2, 4, 7, 8, 9, 10, 11],
    AS: [3, 4, 6, 10, 11, 12],
    RA: [], KE: [],
  },
  MO: {
    SU: [3, 6, 7, 8, 10, 11],
    MO: [1, 3, 6, 7, 10, 11],
    MA: [2, 3, 5, 6, 9, 10, 11],
    ME: [1, 3, 4, 5, 7, 8, 10, 11],
    JU: [1, 4, 7, 8, 10, 11, 12],
    VE: [3, 4, 5, 7, 9, 10, 11],
    SA: [3, 5, 6, 11],
    AS: [3, 6, 10, 11],
    RA: [], KE: [],
  },
  MA: {
    SU: [3, 5, 6, 10, 11],
    MO: [3, 6, 11],
    MA: [1, 2, 4, 7, 8, 10, 11],
    ME: [3, 5, 6, 11],
    JU: [6, 10, 11, 12],
    VE: [6, 8, 11, 12],
    SA: [1, 4, 7, 8, 9, 10, 11],
    AS: [1, 3, 6, 10, 11],
    RA: [], KE: [],
  },
  ME: {
    SU: [5, 6, 9, 11, 12],
    MO: [2, 4, 6, 8, 10, 11],
    MA: [1, 2, 4, 7, 8, 9, 10, 11],
    ME: [1, 3, 5, 6, 9, 10, 11, 12],
    JU: [6, 8, 11, 12],
    VE: [1, 2, 3, 4, 5, 8, 9, 11],
    SA: [1, 2, 4, 7, 8, 9, 10, 11],
    AS: [1, 2, 4, 6, 8, 10, 11],
    RA: [], KE: [],
  },
  JU: {
    SU: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    MO: [2, 5, 7, 9, 11],
    MA: [1, 2, 4, 7, 8, 10, 11],
    ME: [1, 2, 4, 5, 6, 9, 10, 11],
    JU: [1, 2, 3, 4, 7, 8, 10, 11],
    VE: [2, 5, 6, 9, 10, 11],
    SA: [3, 5, 6, 12],
    AS: [1, 2, 4, 5, 6, 7, 9, 10, 11],
    RA: [], KE: [],
  },
  VE: {
    SU: [8, 11, 12],
    MO: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    MA: [3, 5, 6, 9, 11, 12],
    ME: [3, 5, 6, 9, 11],
    JU: [5, 8, 9, 10, 11],
    VE: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    SA: [3, 4, 5, 8, 9, 10, 11],
    AS: [1, 2, 3, 4, 5, 8, 9, 11],
    RA: [], KE: [],
  },
  SA: {
    SU: [1, 2, 4, 7, 8, 10, 11],
    MO: [3, 6, 11],
    MA: [3, 5, 6, 10, 11, 12],
    ME: [6, 8, 9, 10, 11, 12],
    JU: [5, 6, 11, 12],
    VE: [6, 11, 12],
    SA: [3, 5, 6, 11],
    AS: [1, 3, 4, 6, 10, 11],
    RA: [], KE: [],
  },
  // Nodes don't take kaksha bala (no natal BAV chart for Rahu/Ketu)
  RA: {} as any,
  KE: {} as any,
};

function dist(fromSignNum: number, toSignNum: number): number {
  return ((toSignNum - fromSignNum + 12) % 12) + 1;
}

export interface KakshyaOccupancy {
  planet: PlanetId;
  signName: string;
  longitude: number;
  kakshyaIndex: number;     // 0..7
  kakshyaLord: Contributor;
  degInKakshya: number;
  kakshaBala: number;       // 0..8
  contributors: { by: Contributor; gives: boolean }[];
}

export interface KakshaBalaResult {
  rows: KakshyaOccupancy[];
  summary: { planet: PlanetId; bala: number; rank: number }[];
}

function kakshaBalaForPlanet(
  subject: PlanetId,
  subjectSignNum: number,
  contributorSigns: Record<Contributor, number>,
): { bala: number; contributors: { by: Contributor; gives: boolean }[] } {
  const rules = BAV_RULES[subject];
  const contributors: { by: Contributor; gives: boolean }[] = [];
  let bala = 0;
  if (!rules || Object.keys(rules).length === 0) return { bala: 0, contributors };
  for (const c of KAKSHA_ORDER) {
    const list = rules[c] || [];
    const fromSign = contributorSigns[c];
    if (!fromSign) { contributors.push({ by: c, gives: false }); continue; }
    const d = dist(fromSign, subjectSignNum);
    const gives = list.includes(d);
    if (gives) bala++;
    contributors.push({ by: c, gives });
  }
  return { bala, contributors };
}

export function computeKakshaBala(natal: KundaliResult): KakshaBalaResult {
  const signFor = (id: PlanetId): number => {
    const p = natal.planets.find((x) => x.id === id);
    return p ? p.rashi.num : 0;
  };
  const contributorSigns: Record<Contributor, number> = {
    SU: signFor('SU'), MO: signFor('MO'), MA: signFor('MA'),
    ME: signFor('ME'), JU: signFor('JU'), VE: signFor('VE'),
    SA: signFor('SA'),
    AS: natal.ascendant.rashi.num,
    RA: signFor('RA'), KE: signFor('KE'),
  };

  const subjects: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA'];
  const rows: KakshyaOccupancy[] = subjects.map((p) => {
    const pos = natal.planets.find((x) => x.id === p)!;
    const degInSign = pos.rashi.degInRashi;
    const kIdx = Math.min(7, Math.floor(degInSign / KAKSHYA_SPAN));
    const lord = KAKSHA_ORDER[kIdx];
    const { bala, contributors } = kakshaBalaForPlanet(p, pos.rashi.num, contributorSigns);
    return {
      planet: p,
      signName: RASHIS[pos.rashi.num - 1].name,
      longitude: pos.longitude,
      kakshyaIndex: kIdx,
      kakshyaLord: lord,
      degInKakshya: degInSign - kIdx * KAKSHYA_SPAN,
      kakshaBala: bala,
      contributors,
    };
  });

  const summary = [...rows]
    .map((r) => ({ planet: r.planet, bala: r.kakshaBala }))
    .sort((a, b) => b.bala - a.bala)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return { rows, summary };
}
