// GET /api/geo/cities?q=<query>&limit=<n>
// Proxies OpenStreetMap Nominatim so the client can find any village/town
// worldwide — including small Indian places not in the bundled CITIES list.
// Nominatim requires a descriptive User-Agent and rate-limits to ~1 req/s,
// which is fine for autocomplete (debounced on the client).

import { Router } from 'express';

const router = Router();

// Minimal country → civil offset in hours. India/neighbours are what users
// hit most; the rest fall back to 0 and the user can tweak it. DST is the
// caller's responsibility (same contract as the offline CITIES list).
const COUNTRY_TZ: Record<string, number> = {
  IN: 5.5, NP: 5.75, LK: 5.5, BD: 6, PK: 5, BT: 6, MM: 6.5, MV: 5,
  AE: 4, SA: 3, QA: 3, KW: 3, OM: 4, BH: 3,
  US: -5, CA: -5, GB: 0, IE: 0, FR: 1, DE: 1, IT: 1, ES: 1, NL: 1,
  BE: 1, CH: 1, AT: 1, SE: 1, NO: 1, DK: 1, FI: 2, PL: 1, PT: 0,
  RU: 3, TR: 3, GR: 2, UA: 2, EG: 2, KE: 3, ZA: 2, NG: 1,
  CN: 8, JP: 9, KR: 9, SG: 8, MY: 8, TH: 7, VN: 7, ID: 7, PH: 8,
  AU: 10, NZ: 12, BR: -3, AR: -3, MX: -6, CL: -4,
};

interface NominatimHit {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    village?: string; hamlet?: string; town?: string; city?: string;
    municipality?: string; suburb?: string; county?: string;
    state_district?: string; state?: string; region?: string;
    country?: string; country_code?: string;
  };
  type?: string;
  class?: string;
  category?: string; // jsonv2 field
  addresstype?: string;
}

router.get('/cities', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const limit = Math.min(25, Math.max(1, Number(req.query.limit ?? 12)));
  if (q.length < 2) {
    return res.json({ ok: true, hits: [] });
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('q', q);
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('accept-language', 'en');

    const r = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AstrologerHemrajLaddha/0.1 (Vedic Astrology Suite; contact via app)',
        Accept: 'application/json',
      },
    });
    if (!r.ok) {
      return res.status(502).json({ ok: false, error: `geocoder ${r.status}` });
    }
    const raw = (await r.json()) as NominatimHit[];

    const hits = raw
      .filter((h) => {
        // Keep populated places only; drop rivers, mountains, businesses, etc.
        const cls = h.category ?? h.class ?? '';
        const typ = h.type ?? '';
        if (cls === 'place') return true;
        if (cls === 'boundary' && typ === 'administrative') return true;
        return false;
      })
      .map((h) => {
        const a = h.address ?? {};
        const name =
          a.village ?? a.hamlet ?? a.town ?? a.city ?? a.municipality ?? a.suburb ??
          a.county ?? a.state_district ?? a.state ?? h.display_name.split(',')[0];
        const admin = a.state ?? a.state_district ?? a.county ?? a.country ?? '';
        const cc = (a.country_code ?? '').toUpperCase();
        const tz = COUNTRY_TZ[cc] ?? 0;
        return {
          name,
          admin,
          country: cc,
          lat: Number(h.lat),
          lng: Number(h.lon),
          tz,
        };
      })
      .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng) && h.name);

    res.json({ ok: true, hits });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message ?? 'geocode failed' });
  }
});

export default router;
