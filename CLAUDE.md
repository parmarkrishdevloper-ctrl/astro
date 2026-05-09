# Astrologer Hemraj Laddha — Vedic Astrology Suite

Vedic astrology suite for **Astrologer Hemraj Laddha**. Full Vedic computations run locally
using Swiss Ephemeris — **no third-party astrology APIs**.

## Stack
- **Server:** Node 20 + Express + TypeScript + Mongoose, `swisseph` (native binding)
- **Client:** React 18 + Vite + TailwindCSS + Zustand + React Router v6
- **PDF:** Puppeteer (server-side HTML → PDF)
- **DB:** MongoDB

## Workspaces
This repo is an npm workspaces monorepo: `server/`, `client/`, `shared/`.

## Dev
```bash
npm install              # installs all workspaces
npm run dev              # runs server (4000) + client (5173) concurrently
npm run dev:server
npm run dev:client
```

## Ephemeris data
Swiss Ephemeris data files must live in `server/ephe/`. Required files:
`sepl_18.se1`, `semo_18.se1`, `seas_18.se1`. Download from
https://github.com/aloistr/swisseph/tree/master/ephe

## Verify the engine
After `npm install` and starting the server, hit:
```
GET http://localhost:4000/api/health
GET http://localhost:4000/api/kundali/verify
```
The verify endpoint computes the Sun's sidereal longitude for a fixed datetime
and returns it — proves swisseph + Lahiri ayanamsa are wired correctly.

## Astrology engine notes
1. Always pass `SEFLG_SIDEREAL`. Default ayanamsa: Lahiri.
2. Ketu = (Rahu longitude + 180) mod 360. Use `SE_TRUE_NODE` for Rahu.
3. Store all timestamps as UTC; convert at the edges only.
4. Vedic aspects: all planets aspect 7th; Mars also 4th & 8th; Jupiter 5th & 9th;
   Saturn 3rd & 10th.

## Build phases
- **Phase 1 (current):** monorepo + Express + Mongo + swisseph verify + Vite React boot
- Phase 2: astro-constants, ephemeris/kundali/divisional/dasha services
- Phase 3: SVG charts (North/South), planet table, dasha timeline, birth form
- Phase 4: matching, panchang, dosha, yoga, strength, muhurat, numerology
- Phase 5: PDF templates + service + admin branding panel
- Phase 6: full frontend pages
- Phase 7: i18n, dark mode, tests, Docker, caching
