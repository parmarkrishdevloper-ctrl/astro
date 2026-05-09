import type { KundaliResult, PlanetPosition } from '../../types';
import { useT } from '../../i18n';

/**
 * South Indian box-grid Kundali.
 *
 * SIGNS are fixed in cells (Pisces top-left, then clockwise around the
 * border). HOUSES rotate. Lagna's cell is marked with a diagonal slash.
 *
 * Fixed sign layout (rashi number 1..12 = Aries..Pisces):
 *
 *   row 0:  Pi(12)  Ar(1)   Ta(2)   Ge(3)
 *   row 1:  Aq(11)  ----    ----    Ca(4)
 *   row 2:  Cp(10)  ----    ----    Le(5)
 *   row 3:  Sg(9)   Sc(8)   Li(7)   Vi(6)
 */

const SIZE = 360;
const CELL = SIZE / 4;

interface Cell {
  rashi: number;
  row: number;
  col: number;
}

// Map rashi (1..12) → grid cell
const CELLS: Cell[] = [
  { rashi: 12, row: 0, col: 0 },
  { rashi: 1,  row: 0, col: 1 },
  { rashi: 2,  row: 0, col: 2 },
  { rashi: 3,  row: 0, col: 3 },
  { rashi: 4,  row: 1, col: 3 },
  { rashi: 5,  row: 2, col: 3 },
  { rashi: 6,  row: 3, col: 3 },
  { rashi: 7,  row: 3, col: 2 },
  { rashi: 8,  row: 3, col: 1 },
  { rashi: 9,  row: 3, col: 0 },
  { rashi: 10, row: 2, col: 0 },
  { rashi: 11, row: 1, col: 0 },
];

interface Props {
  kundali: KundaliResult;
  className?: string;
}

export function SouthIndianChart({ kundali, className }: Props) {
  const { al } = useT();
  const lagnaRashi = kundali.ascendant.rashi.num;
  const byRashi = new Map<number, PlanetPosition[]>();
  for (const p of kundali.planets) {
    const list = byRashi.get(p.rashi.num) ?? [];
    list.push(p);
    byRashi.set(p.rashi.num, list);
  }

  return (
    <svg
      viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
      className={className ?? 'w-full max-w-md'}
      role="img"
      aria-label="South Indian Kundali"
    >
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="#FFF8E7" />

      {CELLS.map(({ rashi, row, col }) => {
        const x = col * CELL;
        const y = row * CELL;
        const planets = byRashi.get(rashi) ?? [];
        const isLagna = rashi === lagnaRashi;
        const houseNum = ((rashi - lagnaRashi + 12) % 12) + 1;
        return (
          <g key={rashi}>
            <rect
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              fill={isLagna ? '#FBEFD8' : '#FFF8E7'}
              stroke="#7B1E1E"
              strokeWidth={1.5}
            />
            {/* Lagna marker — diagonal slash from top-left */}
            {isLagna && (
              <line
                x1={x}
                y1={y}
                x2={x + CELL * 0.45}
                y2={y + CELL * 0.45}
                stroke="#C2410C"
                strokeWidth={2}
              />
            )}
            {/* Sign abbreviation, top-left corner */}
            <text
              x={x + 6}
              y={y + 12}
              fontSize={9}
              fill="#7B1E1E"
              opacity={0.6}
            >
              {al.rashiShort(rashi)}
            </text>
            {/* House number, top-right corner */}
            <text
              x={x + CELL - 6}
              y={y + 12}
              fontSize={9}
              textAnchor="end"
              fill="#7B1E1E"
              opacity={0.6}
            >
              {houseNum}
            </text>
            {/* Planets, centered */}
            {planets.map((p, i) => {
              const cols = planets.length > 3 ? 2 : 1;
              const col2 = i % cols;
              const row2 = Math.floor(i / cols);
              const dx = (col2 - (cols - 1) / 2) * 26;
              const dy = (row2 - (Math.ceil(planets.length / cols) - 1) / 2) * 14;
              const fill = p.id === 'SU' ? '#C2410C'
                          : p.id === 'MO' ? '#4338CA'
                          : p.id === 'MA' ? '#B91C1C'
                          : p.id === 'ME' ? '#047857'
                          : p.id === 'JU' ? '#B45309'
                          : p.id === 'VE' ? '#9D174D'
                          : p.id === 'SA' ? '#1F2937'
                          : '#374151';
              return (
                <text
                  key={p.id}
                  x={x + CELL / 2 + dx}
                  y={y + CELL / 2 + dy + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill={fill}
                >
                  {al.planetShort(p.id)}
                  {p.retrograde ? '↺' : ''}
                </text>
              );
            })}
          </g>
        );
      })}

      {/* Outer border */}
      <rect
        x={0}
        y={0}
        width={SIZE}
        height={SIZE}
        fill="none"
        stroke="#7B1E1E"
        strokeWidth={2.5}
      />
    </svg>
  );
}
