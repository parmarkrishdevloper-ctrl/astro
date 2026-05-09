import type { KundaliResult } from '../../types';
import { useT } from '../../i18n';

function fmtDeg(d: number) {
  const deg = Math.floor(d);
  const minF = (d - deg) * 60;
  const min = Math.floor(minF);
  const sec = Math.round((minF - min) * 60);
  return `${deg}°${String(min).padStart(2, '0')}'${String(sec).padStart(2, '0')}"`;
}

export function PlanetTable({ kundali }: { kundali: KundaliResult }) {
  const { t, al } = useT();
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-header-title">{t('kundali.planets')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="py-2 px-3">{t('common.planet')}</th>
              <th className="py-2 px-3 text-right">{t('common.longitude', 'Longitude')}</th>
              <th className="py-2 px-3">{t('common.sign')}</th>
              <th className="py-2 px-3 text-right">{t('common.deg', 'Deg')}</th>
              <th className="py-2 px-3">{t('common.nakshatra')}</th>
              <th className="py-2 px-3 text-center">{t('common.pada', 'pada')}</th>
              <th className="py-2 px-3 text-center">{t('common.house')}</th>
              <th className="py-2 px-3 text-center">{t('common.flags', 'Flags')}</th>
            </tr>
          </thead>
          <tbody>
            {kundali.planets.map((p) => (
              <tr key={p.id} className="hover:bg-parchment/40">
                <td className="py-2 px-3">
                  <span className="font-semibold">{al.planet(p.id)}</span>
                </td>
                <td className="py-2 px-3 text-right tabular-nums">{fmtDeg(p.longitude)}</td>
                <td className="py-2 px-3">{al.rashi(p.rashi.num)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{fmtDeg(p.rashi.degInRashi)}</td>
                <td className="py-2 px-3">{al.nakshatra(p.nakshatra.num)}</td>
                <td className="py-2 px-3 text-center">{p.nakshatra.pada}</td>
                <td className="py-2 px-3 text-center font-semibold text-vedicMaroon">{p.house}</td>
                <td className="py-2 px-3 text-center space-x-1">
                  {p.retrograde && <Tag color="bg-gray-200 text-gray-700">{t('dignity.retrogradeShort', 'R')}</Tag>}
                  {p.exalted && <Tag color="bg-emerald-100 text-emerald-700">{t('dignity.exaltShort', 'EX')}</Tag>}
                  {p.debilitated && <Tag color="bg-red-100 text-red-700">{t('dignity.debilShort', 'DB')}</Tag>}
                  {p.combust && <Tag color="bg-amber-100 text-amber-700">{t('dignity.combustShort', 'C')}</Tag>}
                  {p.ownSign && <Tag color="bg-vedicGold/20 text-vedicMaroon">{t('dignity.ownShort', 'OWN')}</Tag>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${color}`}>
      {children}
    </span>
  );
}
