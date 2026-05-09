import { useState } from 'react';
import type { VimshottariResult, DashaPeriod } from '../../types';
import { useT } from '../../i18n';

const PLANET_COLOR: Record<string, string> = {
  KE: '#6B7280',
  VE: '#9D174D',
  SU: '#C2410C',
  MO: '#4338CA',
  MA: '#B91C1C',
  RA: '#374151',
  JU: '#B45309',
  SA: '#1F2937',
  ME: '#047857',
};

function fmtDate(iso: string) {
  return iso.slice(0, 10);
}

function isActive(p: DashaPeriod, now = Date.now()) {
  const s = new Date(p.start).getTime();
  const e = new Date(p.end).getTime();
  return s <= now && now < e;
}

interface Props {
  vimshottari: VimshottariResult;
}

export function DashaTimeline({ vimshottari }: Props) {
  const { t, al } = useT();
  const [openIdx, setOpenIdx] = useState<number | null>(
    vimshottari.mahadashas.findIndex((m) => isActive(m)),
  );

  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-vedicGold/30 bg-parchment flex items-center justify-between">
        <h3 className="text-sm font-semibold text-vedicMaroon">
          {t('dasha.vimshottari', 'Vimshottari Dasha')}
        </h3>
        <span className="text-[10px] opacity-60">
          {t('dasha.birthNakshatra', 'birth nakshatra')}: {al.nakshatra(vimshottari.startNakshatra.num)} ({t('dasha.lord', 'lord')} {al.planet(vimshottari.startNakshatra.lord)})
        </span>
      </div>

      <ul className="divide-y divide-vedicGold/15">
        {vimshottari.mahadashas.map((m, i) => {
          const active = isActive(m);
          const open = openIdx === i;
          return (
            <li key={i}>
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className={
                  'w-full grid grid-cols-[40px_1fr_auto_auto] items-center gap-3 px-5 py-3 text-left hover:bg-parchment/40 ' +
                  (active ? 'bg-vedicGold/10' : '')
                }
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: PLANET_COLOR[m.lord] }}
                >
                  {al.planetShort(m.lord)}
                </span>
                <div>
                  <div className="text-sm font-semibold text-vedicMaroon">
                    {al.planet(m.lord)} {t('dasha.mahadashaSuffix', 'Mahadasha')}
                    {active && (
                      <span className="ml-2 text-[10px] uppercase rounded bg-saffron text-white px-1.5 py-0.5">
                        {t('common.active', 'Active')}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] opacity-60">
                    {fmtDate(m.start)} → {fmtDate(m.end)}
                  </div>
                </div>
                <span className="text-xs tabular-nums opacity-70">
                  {m.years.toFixed(2)}{t('common.yearShort', 'y')}
                </span>
                <span className="text-vedicMaroon/50 text-xs">{open ? '▾' : '▸'}</span>
              </button>

              {open && m.antardashas && (
                <ul className="bg-parchment/30 border-t border-vedicGold/15">
                  {m.antardashas.map((a, j) => {
                    const aActive = isActive(a);
                    return (
                      <li
                        key={j}
                        className={
                          'grid grid-cols-[28px_1fr_auto] items-center gap-3 pl-12 pr-5 py-2 text-xs ' +
                          (aActive ? 'bg-vedicGold/10' : '')
                        }
                      >
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: PLANET_COLOR[a.lord] }}
                        >
                          {al.planetShort(a.lord)}
                        </span>
                        <div>
                          <span className="font-medium">{al.planet(a.lord)}</span>
                          <span className="opacity-60 ml-2">
                            {fmtDate(a.start)} → {fmtDate(a.end)}
                          </span>
                          {aActive && (
                            <span className="ml-2 text-[9px] uppercase rounded bg-saffron text-white px-1.5 py-0.5">
                              {t('common.active', 'Active')}
                            </span>
                          )}
                        </div>
                        <span className="tabular-nums opacity-60">
                          {a.years.toFixed(2)}{t('common.yearShort', 'y')}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
