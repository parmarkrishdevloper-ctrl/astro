// HTML template for the Matching (Ashtakoot + extras) report. Returns a
// string of HTML5 ready for Puppeteer's setContent().

import { MatchingResult } from '../services/matching.service';
import { IBranding } from '../models/branding.model';
import { type Locale, p, pf, translator } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface MatchingReportData {
  matching: MatchingResult;
  boyName?: string;
  girlName?: string;
  branding: Partial<IBranding>;
  generatedAt: Date;
  locale?: Locale;
}

export function renderMatchingReport(d: MatchingReportData): string {
  const { matching: m, branding } = d;
  const locale: Locale = d.locale ?? 'en';
  const t = translator(locale);
  const al = astroLabels(locale);
  const tx = (key: string, fb?: string) => p(key, locale, fb);
  const tf = (key: string, vars: Record<string, string | number>, fb?: string) =>
    pf(key, locale, vars, fb);

  const primary = branding.primaryColor ?? '#7c2d12';
  const accent = branding.accentColor ?? '#b45309';
  const company = branding.companyName ?? 'Astrologer Hemraj Laddha';
  const tagline = branding.tagline ?? 'Vedic Astrology Suite';

  const boyName  = d.boyName  || tx('pdf.matching.boy', 'Boy');
  const girlName = d.girlName || tx('pdf.matching.girl', 'Girl');
  const ts = d.generatedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const verdictColor =
    m.verdictTone === 'excellent' ? '#15803d' :
    m.verdictTone === 'good' ? '#4d7c0f' :
    m.verdictTone === 'acceptable' ? '#b45309' : '#b91c1c';

  const kootRows = m.koots.map((k) => {
    const pct = Math.round((k.obtained / k.max) * 100);
    const bar = pct >= 75 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
    return `
      <tr>
        <td class="strong">${esc(k.name)}</td>
        <td class="num">${k.obtained}/${k.max}</td>
        <td class="detail">${esc(k.detail)}</td>
        <td>
          <div class="bar-wrap"><div class="bar" style="width:${pct}%;background:${bar}"></div></div>
        </td>
      </tr>
    `;
  }).join('');

  const kootCards = m.koots.map((k) => `
    <div class="koot-card">
      <div class="koot-head">
        <div class="koot-name">${esc(k.name)}</div>
        <div class="koot-score">${k.obtained}<span class="muted"> / ${k.max}</span></div>
      </div>
      <div class="muted small">${esc(k.detail)}</div>
      <div class="desc">${esc(k.description)}</div>
    </div>
  `).join('');

  const ascLabel    = tx('pdf.matching.ascendant', 'Ascendant');
  const moonRashi   = tx('pdf.matching.moonRashi', 'Moon rashi');
  const moonNak     = tx('pdf.matching.moonNakshatra', 'Moon nakshatra');
  const varnaLbl    = tx('pdf.matching.varna', 'Varna');
  const vashyaLbl   = tx('pdf.matching.vashya', 'Vashya');
  const yoniLbl     = tx('pdf.matching.yoni', 'Yoni');
  const ganaLbl     = tx('pdf.matching.gana', 'Gana');
  const nadiLbl     = tx('pdf.matching.nadi', 'Nadi');
  const marsHouseLbl= tx('pdf.matching.marsHouse', 'Mars house');
  const dashaLbl    = tx('pdf.matching.currentDasha', 'Current mahadasha');
  const lordWord    = tx('pdf.common.lord', 'Lord').toLowerCase();
  const padaWord    = 'pada'; // glyph-style word reused across locales

  function personCard(who: string, prof: MatchingResult['boy']): string {
    return `
      <div class="person">
        <h3>${esc(who)}</h3>
        <table class="kv">
          <tr><td>${esc(ascLabel)}</td><td>${esc(al.rashiByName(prof.ascendantRashi))}</td></tr>
          <tr><td>${esc(moonRashi)}</td><td>${esc(al.rashi(prof.rashiNum))} (${esc(lordWord)} ${esc(al.planet(prof.rashiLord))})</td></tr>
          <tr><td>${esc(moonNak)}</td><td>${esc(al.nakshatra(prof.nakNum))} ${esc(padaWord)} ${prof.pada} (${esc(lordWord)} ${esc(al.planet(prof.nakLord))})</td></tr>
          <tr><td>${esc(varnaLbl)}</td><td>${esc(prof.varna)}</td></tr>
          <tr><td>${esc(vashyaLbl)}</td><td>${esc(prof.vashya)}</td></tr>
          <tr><td>${esc(yoniLbl)}</td><td>${esc(prof.yoni)}</td></tr>
          <tr><td>${esc(ganaLbl)}</td><td>${esc(prof.gana)}</td></tr>
          <tr><td>${esc(nadiLbl)}</td><td>${esc(prof.nadi)}</td></tr>
          <tr><td>${esc(marsHouseLbl)}</td><td>${prof.marsHouse}</td></tr>
          <tr><td>${esc(dashaLbl)}</td><td>${esc(al.planet(prof.currentDasha))}</td></tr>
        </table>
      </div>
    `;
  }

  const activeMangal    = tx('pdf.matching.activeMangal', 'Active Mangal dosha');
  const cancelledMangal = tx('pdf.matching.doshaCancelled', 'Dosha cancelled');
  const noMangal        = tx('pdf.matching.noDosha', 'No dosha');

  const mangBox = `
    <div class="dosha-grid">
      <div class="dosha-card">
        <div class="dosha-head">${esc(tf('pdf.matching.boyMangal', { name: boyName }, `${boyName} — Manglik`))}</div>
        <div>${esc(tf('pdf.matching.marsInHouse',
              { house: m.manglik.boy.marsHouse, rashi: al.rashiByName(m.manglik.boy.marsRashi) },
              `Mars in ${m.manglik.boy.marsHouse}th (${m.manglik.boy.marsRashi})`))}
             · <strong>${esc(m.manglik.boy.netManglik ? activeMangal : m.manglik.boy.isManglik ? cancelledMangal : noMangal)}</strong></div>
        ${m.manglik.boy.cancellations.length
          ? `<ul>${m.manglik.boy.cancellations.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      </div>
      <div class="dosha-card">
        <div class="dosha-head">${esc(tf('pdf.matching.girlMangal', { name: girlName }, `${girlName} — Manglik`))}</div>
        <div>${esc(tf('pdf.matching.marsInHouse',
              { house: m.manglik.girl.marsHouse, rashi: al.rashiByName(m.manglik.girl.marsRashi) },
              `Mars in ${m.manglik.girl.marsHouse}th (${m.manglik.girl.marsRashi})`))}
             · <strong>${esc(m.manglik.girl.netManglik ? activeMangal : m.manglik.girl.isManglik ? cancelledMangal : noMangal)}</strong></div>
        ${m.manglik.girl.cancellations.length
          ? `<ul>${m.manglik.girl.cancellations.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      </div>
    </div>
    <p class="conclusion ${m.manglik.compatible ? 'ok' : 'bad'}">
      ${esc(m.manglik.note)}
    </p>
  `;

  function doshaBox(title: string, dx: MatchingResult['nadiDosha']): string {
    const status = !dx.present
      ? { label: tx('pdf.common.notPresent', 'Not present'), cls: 'ok' }
      : dx.cancelled
      ? { label: tx('pdf.matching.statusCancelled', 'Present but cancelled'), cls: 'warn' }
      : { label: tx('pdf.matching.statusActive', 'Active — caution'), cls: 'bad' };
    return `
      <div class="dosha-card">
        <div class="dosha-head">${esc(title)}</div>
        <div class="status ${status.cls}">${esc(status.label)}</div>
        ${dx.reasons.length
          ? `<div class="small muted">${esc(tx('pdf.matching.cancellations', 'Cancellations'))}:</div><ul>${dx.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`
          : ''}
      </div>
    `;
  }

  const yesLbl = tx('pdf.matching.yes', 'Yes');
  const noLbl  = tx('pdf.matching.no', 'No');
  const presentLbl = tx('pdf.common.present', 'Present');
  const absentLbl  = tx('pdf.matching.absent', 'Absent');

  const extraRows = m.extras.map((e) => {
    const isYesNo = e.name === 'Mahendra' || e.name === 'Stri Dheerga' ||
                    e.nameLabel === t.extraDosha('Mahendra') ||
                    e.nameLabel === t.extraDosha('Stri Dheerga');
    const result = e.present
      ? (isYesNo ? yesLbl : presentLbl)
      : (isYesNo ? noLbl : absentLbl);
    return `
      <tr>
        <td class="strong">${esc(e.nameLabel ?? e.name)}</td>
        <td class="${e.present ? 'bad' : 'ok'} strong">${esc(result)}</td>
        <td>${esc(e.note)}</td>
      </tr>
    `;
  }).join('');

  const recList = m.recommendations.map((r) => `<li>${esc(r)}</li>`).join('');

  return `
<!doctype html>
<html lang="${esc(locale)}">
<head>
<meta charset="utf-8" />
<title>${esc(tx('pdf.matching.title', 'Ashtakoot Matching Report'))} — ${esc(boyName)} × ${esc(girlName)}</title>
<style>
  @page { size: A4; }
  html, body { margin: 0; font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'Helvetica', 'Arial', system-ui, sans-serif; color: #1e293b; }
  h1, h2, h3 { color: ${primary}; font-family: Georgia, 'Tiro Devanagari Sanskrit', 'Tiro Devanagari Hindi', 'Tiro Gujarati', serif; }
  h1 { margin: 0; font-size: 22px; }
  h2 { font-size: 15px; margin: 22px 0 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 8px 0; color: ${accent}; }
  .small { font-size: 10px; }
  .muted { color: #64748b; }
  .strong { font-weight: 600; color: #0f172a; }
  .ok { color: #15803d; }
  .warn { color: #b45309; }
  .bad { color: #b91c1c; }
  .page-head { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 0 10px; border-bottom: 2px solid ${primary}; }
  .brand { color: ${primary}; font-weight: 700; font-size: 18px; }
  .tagline { color: ${accent}; font-size: 11px; }
  .ts { text-align: right; color: #64748b; font-size: 10px; }

  .verdict { margin-top: 16px; padding: 14px 18px; border-radius: 10px;
    background: linear-gradient(90deg, ${primary}08, ${accent}12); display: flex; justify-content: space-between; align-items: center; }
  .score-big { font-size: 36px; font-weight: 700; color: ${primary}; line-height: 1; }
  .score-max { font-size: 18px; color: #94a3b8; }
  .verdict-text { font-size: 13px; color: ${verdictColor}; font-weight: 600; margin-top: 2px; }

  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .person { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }
  table.kv { width: 100%; font-size: 11px; border-collapse: collapse; }
  table.kv td { padding: 3px 0; }
  table.kv td:first-child { color: #64748b; }
  table.kv td:last-child { text-align: right; font-weight: 600; }

  table.kootsT { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.kootsT th, table.kootsT td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; text-align: left; }
  table.kootsT th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.06em; font-size: 9px; color: #475569; }
  .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  .detail { color: #475569; }
  .bar-wrap { width: 100px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
  .bar { height: 100%; }

  .koot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .koot-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; break-inside: avoid; }
  .koot-head { display: flex; justify-content: space-between; margin-bottom: 2px; }
  .koot-name { font-weight: 700; color: ${primary}; }
  .koot-score { font-weight: 600; }
  .koot-card .desc { font-size: 10.5px; color: #334155; margin-top: 6px; line-height: 1.4; }

  .dosha-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .dosha-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; break-inside: avoid; font-size: 11px; }
  .dosha-head { font-weight: 700; color: ${primary}; margin-bottom: 4px; }
  .status { font-weight: 600; }
  .dosha-card ul { margin: 4px 0 0 16px; padding: 0; }
  .dosha-card li { font-size: 10.5px; }
  .conclusion { padding: 8px 12px; border-radius: 6px; font-size: 11px; }
  .conclusion.ok { background: #ecfdf5; color: #065f46; }
  .conclusion.bad { background: #fef2f2; color: #991b1b; }

  ul.rec { margin: 6px 0 0 18px; padding: 0; font-size: 11px; }
  ul.rec li { margin-bottom: 4px; }

  footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>

<div class="page-head">
  <div>
    <div class="brand">${esc(company)}</div>
    <div class="tagline">${esc(tagline)}</div>
  </div>
  <div class="ts">
    <div>${esc(tx('pdf.common.generated', 'Generated'))} ${esc(ts)}</div>
  </div>
</div>

<h1>${esc(tx('pdf.matching.title', 'Ashtakoot Matching Report'))} — ${esc(boyName)} × ${esc(girlName)}</h1>

<div class="verdict">
  <div>
    <div class="score-big">${m.total.obtained}<span class="score-max"> / ${m.total.max}</span></div>
    <div class="muted small">${esc(tf('pdf.matching.compatibility', { pct: m.total.percentage }, `${m.total.percentage}% compatibility`))}</div>
  </div>
  <div class="verdict-text">${esc(m.verdict)}</div>
</div>

<h2>${esc(tx('pdf.matching.partnerProfiles', 'Birth profiles'))}</h2>
<div class="two">
  ${personCard(boyName, m.boy)}
  ${personCard(girlName, m.girl)}
</div>

<h2>${esc(tx('pdf.matching.kootBreakdown', 'Koot-by-koot score'))}</h2>
<table class="kootsT">
  <thead><tr>
    <th>${esc(tx('pdf.matching.koot', 'Koot'))}</th>
    <th class="num">${esc(tx('pdf.matching.score', 'Score'))}</th>
    <th>${esc(tx('pdf.matching.detail', 'Detail'))}</th>
    <th></th>
  </tr></thead>
  <tbody>${kootRows}</tbody>
  <tfoot>
    <tr>
      <td class="strong">${esc(tx('pdf.matching.total', 'Total'))}</td>
      <td class="num">${m.total.obtained}/${m.total.max}</td>
      <td>${esc(tf('pdf.matching.compatibility', { pct: m.total.percentage }, `${m.total.percentage}% compatibility`))}</td>
      <td></td>
    </tr>
  </tfoot>
</table>

<h2>${esc(tx('pdf.matching.description', 'What each koot means'))}</h2>
<div class="koot-grid">${kootCards}</div>

<h2>${esc(tx('pdf.matching.manglikAnalysis', 'Manglik (Mars) analysis'))}</h2>
${mangBox}

<h2>${esc(tx('pdf.matching.nadiBhakoot', 'Nadi · Bhakoot — cancellations'))}</h2>
<div class="dosha-grid">
  ${doshaBox(tx('pdf.matching.nadiDoshaTitle', 'Nadi Dosha'), m.nadiDosha)}
  ${doshaBox(tx('pdf.matching.bhakootDoshaTitle', 'Bhakoot Dosha'), m.bhakootDosha)}
</div>

<h2>${esc(tx('pdf.matching.additionalChecks', 'Additional checks'))}</h2>
<table class="kootsT">
  <thead><tr>
    <th>${esc(tx('pdf.matching.check', 'Check'))}</th>
    <th>${esc(tx('pdf.matching.result', 'Result'))}</th>
    <th>${esc(tx('pdf.common.note', 'Note'))}</th>
  </tr></thead>
  <tbody>${extraRows}</tbody>
</table>

<h2>${esc(tx('pdf.matching.recommendations', 'Recommendations'))}</h2>
<ul class="rec">${recList}</ul>

<footer>
  ${esc(company)} · ${esc(tagline)} · ${esc(tx('pdf.common.generated', 'Generated'))} · Swiss Ephemeris · Lahiri ${esc(tx('pdf.common.ayanamsa', 'Ayanamsa'))}
</footer>

</body>
</html>
  `;
}
