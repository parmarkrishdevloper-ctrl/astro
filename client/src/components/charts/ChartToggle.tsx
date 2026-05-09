import { useT } from '../../i18n';

export type ChartStyle = 'north' | 'south';

interface Props {
  value: ChartStyle;
  onChange: (s: ChartStyle) => void;
}

export function ChartToggle({ value, onChange }: Props) {
  const { t } = useT();
  return (
    <div className="inline-flex rounded-lg border border-vedicGold/40 overflow-hidden text-xs">
      {(['north', 'south'] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={
            'px-3 py-1.5 ' +
            (value === s
              ? 'bg-saffron text-white'
              : 'bg-white text-vedicMaroon hover:bg-parchment')
          }
        >
          {s === 'north' ? t('chart.northIndian', 'North Indian') : t('chart.southIndian', 'South Indian')}
        </button>
      ))}
    </div>
  );
}
