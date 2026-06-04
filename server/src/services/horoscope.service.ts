// Personal horoscope generator.
//
// Combines today's panchang + running Vimshottari sub-periods + Moon-sign
// transit to build a short daily / weekly / monthly text snippet for a
// specific native. Output is deterministic — same inputs always produce
// the same string, making it safe to bake into PDFs or cache.

import { KundaliResult } from './kundali.service';
import { PlanetId } from '../utils/astro-constants';
import { currentDasha } from './dasha.service';
import { calculatePanchang } from './panchang.service';
import { computeTransits } from './transit.service';
import { rxSnapshot } from './rx-combust.service';

export type HoroscopeScope = 'day' | 'week' | 'month';

export interface HoroscopeReport {
  scope: HoroscopeScope;
  dateFrom: string;
  dateTo: string;
  currentMahaLord: PlanetId | null;
  currentAntarLord: PlanetId | null;
  /** Moon sign & nakshatra at report start */
  moon: { signNum: number; signName: string; nakshatraName: string };
  panchang: {
    tithi: string;
    nakshatra: string;
    vara: string;
    yoga: string;
  };
  retrograde: PlanetId[];
  combust: PlanetId[];
  /** Which natal house(s) are currently under transit from Jupiter / Saturn. */
  transitFocus: { planet: PlanetId; natalHouse: number }[];
  headline: string;             // single-sentence summary
  bullets: string[];             // specific talking points
}

const HOUSE_FOCUS: Record<number, string> = {
  1:  'स्वयं की प्रस्तुति और जीवन शक्ति',
  2:  'धन, वाणी और पारिवारिक गतिशीलता',
  3:  'भाई-बहन, पहल, छोटी यात्राएं',
  4:  'घर, माता, भावनात्मक आधार',
  5:  'रचनात्मकता, रोमांस, अध्ययन',
  6:  'कार्य दिनचर्या, स्वास्थ्य, विवाद समाधान',
  7:  'साझेदारी, व्यापारिक सौदे, जीवनसाथी',
  8:  'परिवर्तन, छिपे हुए विषय, साझा संसाधन',
  9:  'उच्च शिक्षा, गुरु, लंबी यात्राएं',
 10:  'करियर दृश्यता, अधिकारी',
 11:  'लाभ, मित्र मंडल, बड़े लक्ष्य',
 12:  'एकांतवास, एकांत, विदेशी मामले',
};

const PLANET_TONE: Record<PlanetId, string> = {
  SU: 'अधिकारपूर्ण, अहंकार-केंद्रित',
  MO: 'भावनात्मक, सार्वजनिक-सामना',
  MA: 'प्रेरित, संभवतः टकरावपूर्ण',
  ME: 'बौद्धिक, संवादात्मक',
  JU: 'विस्तृत, शिक्षाप्रद, उदार',
  VE: 'संबंधात्मक, कलात्मक, कृपालु',
  SA: 'अनुशासित, धीमा, कर्मिक',
  RA: 'अपरंपरागत, महत्वाकांक्षी, विदेशी',
  KE: 'विरक्त, आत्मनिरीक्षण, रहस्यमय',
};

export function buildHoroscope(natal: KundaliResult, scope: HoroscopeScope, whenISO?: string): HoroscopeReport {
  const start = whenISO ? new Date(whenISO) : new Date();
  const end = new Date(start);
  if (scope === 'day')   end.setUTCDate(start.getUTCDate() + 1);
  if (scope === 'week')  end.setUTCDate(start.getUTCDate() + 7);
  if (scope === 'month') end.setUTCMonth(start.getUTCMonth() + 1);

  const dasha = currentDasha(natal, start);
  const mahaLord = (dasha?.maha?.lord ?? null) as PlanetId | null;
  const antarLord = (dasha?.antar?.lord ?? null) as PlanetId | null;

  const p = calculatePanchang(start, natal.input.lat, natal.input.lng);
  const t = computeTransits(natal, start.toISOString());
  const rx = rxSnapshot(start.toISOString());

  // Jupiter / Saturn natal-house focus
  const focus: { planet: PlanetId; natalHouse: number }[] = t.positions
    .filter((pl) => pl.id === 'JU' || pl.id === 'SA')
    .map((pl) => ({ planet: pl.id as PlanetId, natalHouse: pl.natalHouse }));

  const bullets: string[] = [];
  if (mahaLord && antarLord && dasha?.maha && dasha?.antar) {
    const mahaHouse = natal.planets.find((pl) => pl.id === mahaLord)!.house;
    const antarHouse = natal.planets.find((pl) => pl.id === antarLord)!.house;
    bullets.push(`${mahaLord}/${antarLord} काल चल रहा है — ${PLANET_TONE[mahaLord]} पृष्ठभूमि के साथ ${PLANET_TONE[antarLord]} मुख्यभूमि।`);
    bullets.push(`महादशा स्वामी आपके ${mahaHouse}वें भाव (${HOUSE_FOCUS[mahaHouse]}) में स्थित है; अंतरदशा स्वामी आपके ${antarHouse}वें भाव (${HOUSE_FOCUS[antarHouse]}) में स्थित है।`);
  }
  focus.forEach((f) => {
    bullets.push(`${f.planet} आपके ${f.natalHouse}वें भाव में गोचर कर रहा है — ${HOUSE_FOCUS[f.natalHouse]} पर ध्यान दें।`);
  });
  if (rx.retrograde.length > 0) {
    bullets.push(`अभी वक्री: ${rx.retrograde.join(', ')} — कोई नई शुरुआत करने से पहले समीक्षा करें।`);
  }
  if (rx.combust.length > 0) {
    bullets.push(`अस्त: ${rx.combust.join(', ')} — इनसे जुड़े फल दब सकते हैं।`);
  }
  if (t.sadesati?.active) {
    bullets.push(`साढ़ेसाती — ${t.sadesati.phase} चरण। धीमा, अनुशासित प्रयास फल देगा।`);
  }

  const headline = (() => {
    if (!mahaLord || !antarLord) return `${scope === 'day' ? 'आज' : scope === 'week' ? 'इस सप्ताह' : 'इस महीने'}: तटस्थ काल, स्थिर प्रगति अपेक्षित।`;
    const dominantHouse = focus[0]?.natalHouse ?? natal.planets.find((pl) => pl.id === mahaLord)!.house;
    return `${scope === 'day' ? 'आज' : scope === 'week' ? 'इस सप्ताह' : 'इस महीने'}: ${mahaLord}/${antarLord} — ${HOUSE_FOCUS[dominantHouse]} पर ध्यान।`;
  })();

  return {
    scope,
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
    currentMahaLord: mahaLord,
    currentAntarLord: antarLord,
    moon: {
      signNum: p.nakshatra.num ? natal.planets.find((pl) => pl.id === 'MO')!.rashi.num : natal.planets.find((pl) => pl.id === 'MO')!.rashi.num,
      signName: natal.planets.find((pl) => pl.id === 'MO')!.rashi.name,
      nakshatraName: p.nakshatra.nameHi,
    },
    panchang: {
      tithi: `${p.tithi.paksha} ${p.tithi.name}`,
      nakshatra: p.nakshatra.nameHi,
      vara: p.vara.name,
      yoga: p.yoga.name,
    },
    retrograde: rx.retrograde,
    combust: rx.combust,
    transitFocus: focus,
    headline,
    bullets,
  };
}
