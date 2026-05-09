// Standalone CLI verifier — run with `npm run verify:swisseph` from the server dir.
// Computes Sun's sidereal longitude at 2000-01-01 12:00 UTC and prints it.

import { initEphemeris } from '../config/ephemeris';
import { computeBody } from '../services/ephemeris.service';
import { dateToJD } from '../utils/julian';
import { VEDIC_PLANETS, rashiOf } from '../utils/astro-constants';

function main() {
  initEphemeris();
  const refDate = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
  const jd = dateToJD(refDate);
  console.log(`Reference: ${refDate.toISOString()}   JD = ${jd}`);
  console.log('---');
  for (const p of VEDIC_PLANETS) {
    if (p.computed) continue;
    const pos = computeBody(jd, p.swephId);
    const r = rashiOf(pos.longitude);
    console.log(
      `${p.id}  ${p.name.padEnd(8)}  ${pos.longitude.toFixed(4).padStart(10)}°  ` +
        `${r.name.padEnd(12)} ${r.deg.toFixed(2)}°  ${pos.retrograde ? 'R' : ' '}`,
    );
  }
}

main();
