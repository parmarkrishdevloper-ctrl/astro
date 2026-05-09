import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swisseph = require('swisseph');
import { env } from './env';

export const AYANAMSA_MAP: Record<string, number> = {
  lahiri: swisseph.SE_SIDM_LAHIRI,
  raman: swisseph.SE_SIDM_RAMAN,
  krishnamurti: swisseph.SE_SIDM_KRISHNAMURTI,
  true_chitrapaksha: swisseph.SE_SIDM_TRUE_CITRA,
  yukteshwar: swisseph.SE_SIDM_YUKTESHWAR,
  fagan_bradley: swisseph.SE_SIDM_FAGAN_BRADLEY,
  deluce: swisseph.SE_SIDM_DELUCE,
  jn_bhasin: swisseph.SE_SIDM_JN_BHASIN,
  suryasiddhanta: swisseph.SE_SIDM_SURYASIDDHANTA,
  aryabhata: swisseph.SE_SIDM_ARYABHATA,
};

// House systems — single-character codes accepted by swe_houses_ex.
export const HOUSE_SYSTEM_MAP: Record<string, string> = {
  placidus: 'P',
  koch: 'K',
  whole_sign: 'W',
  equal: 'E',
  sripati: 'O',          // Porphyry — closest common Indian equivalent
  regiomontanus: 'R',
  campanus: 'C',
  topocentric: 'T',
};

/** Change ayanamsa at runtime. Pass a key from AYANAMSA_MAP or a sidereal mode number. */
export function setAyanamsa(key: string | number): void {
  const sid = typeof key === 'number' ? key : (AYANAMSA_MAP[key] ?? AYANAMSA_MAP.lahiri);
  swisseph.swe_set_sid_mode(sid, 0, 0);
}

export function getAyanamsaKeys(): string[] {
  return Object.keys(AYANAMSA_MAP);
}

export function getHouseSystemKeys(): string[] {
  return Object.keys(HOUSE_SYSTEM_MAP);
}

let initialized = false;

export function initEphemeris(): void {
  if (initialized) return;
  if (!fs.existsSync(env.ephePath)) {
    console.warn(
      `[ephe] ephemeris path does not exist: ${env.ephePath}. ` +
        `Swiss Ephemeris will fall back to Moshier (lower precision). ` +
        `Download .se1 files from https://github.com/aloistr/swisseph/tree/master/ephe`,
    );
  }
  swisseph.swe_set_ephe_path(env.ephePath);
  const sid = AYANAMSA_MAP[env.defaultAyanamsa] ?? AYANAMSA_MAP.lahiri;
  swisseph.swe_set_sid_mode(sid, 0, 0);
  initialized = true;
  console.log(`[ephe] initialized (path=${env.ephePath}, ayanamsa=${env.defaultAyanamsa})`);
}

export { swisseph };
