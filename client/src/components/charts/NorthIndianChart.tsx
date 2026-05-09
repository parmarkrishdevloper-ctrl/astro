import type { KundaliResult, PlanetPosition } from '../../types';
import { useT } from '../../i18n';

/**
 * North Indian "diamond" Kundali.
 *
 * Construction: outer square + inner diamond (rotated square through edge
 * midpoints) + the two outer diagonals. This creates 12 regions:
 *   - 4 inner kite quadrilaterals (the kendras: H1, H4, H7, H10)
 *   - 8 outer corner triangles (the other 8 houses)
 *
 * In North Indian charts the HOUSES are fixed in position (Lagna always at
 * top center) and the SIGNS rotate. Numbering goes counter-clockwise from H1.
 */

const SIZE = 360;
const HALF = SIZE / 2;

// Anchor points
const A = { x: 0,    y: 0    };          // top-left outer
const B = { x: SIZE, y: 0    };          // top-right outer
const C = { x: SIZE, y: SIZE };          // bottom-right outer
const D = { x: 0,    y: SIZE };          // bottom-left outer
const P = { x: HALF, y: 0    };          // top mid
const Q = { x: SIZE, y: HALF };          // right mid
const R = { x: HALF, y: SIZE };          // bottom mid
const S = { x: 0,    y: HALF };          // left mid
const O = { x: HALF, y: HALF };          // center
// Midpoints of inner diamond's edges (where outer diagonals enter/exit it)
const m1 = { x: HALF / 2,        y: HALF / 2        };  // SP edge
const m2 = { x: HALF + HALF / 2, y: HALF / 2        };  // PQ edge
const m3 = { x: HALF + HALF / 2, y: HALF + HALF / 2 };  // QR edge
const m4 = { x: HALF / 2,        y: HALF + HALF / 2 };  // RS edge

interface Region {
  house: number;
  poly: { x: number; y: number }[];
  label: { x: number; y: number };
}

function centroid(pts: { x: number; y: number }[]) {
  const n = pts.length;
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / n,
    y: pts.reduce((s, p) => s + p.y, 0) / n,
  };
}

const REGIONS: Region[] = (() => {
  const polys: { house: number; poly: { x: number; y: number }[] }[] = [
    { house: 1,  poly: [P, m1, O, m2] },         // top inner kite
    { house: 2,  poly: [A, P, m1] },             // upper-left, top half
    { house: 3,  poly: [A, m1, S] },             // upper-left, left half
    { house: 4,  poly: [S, m1, O, m4] },         // left inner kite
    { house: 5,  poly: [S, m4, D] },             // lower-left, left half
    { house: 6,  poly: [D, m4, R] },             // lower-left, bottom half
    { house: 7,  poly: [R, m4, O, m3] },         // bottom inner kite
    { house: 8,  poly: [R, m3, C] },             // lower-right, bottom half
    { house: 9,  poly: [C, m3, Q] },             // lower-right, right half
    { house: 10, poly: [Q, m3, O, m2] },         // right inner kite
    { house: 11, poly: [Q, m2, B] },             // upper-right, right half
    { house: 12, poly: [B, m2, P] },             // upper-right, top half
  ];
  return polys.map((p) => ({ ...p, label: centroid(p.poly) }));
})();

function polyPath(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
}

interface Props {
  kundali: KundaliResult;
  className?: string;
}

export function NorthIndianChart({ kundali, className }: Props) {
  const { al, t } = useT();
  // Group planets by house
  const byHouse = new Map<number, PlanetPosition[]>();
  for (const p of kundali.planets) {
    const list = byHouse.get(p.house) ?? [];
    list.push(p);
    byHouse.set(p.house, list);
  }

  // Sign number sitting in each house (whole-sign): house h carries
  // (lagnaRashi + h - 1) mod 12
  const lagnaRashi = kundali.ascendant.rashi.num;
  function rashiOfHouse(h: number) {
    return ((lagnaRashi - 1 + h - 1) % 12) + 1;
  }

  return (
    <svg
      viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
      className={className ?? 'w-full max-w-md'}
      role="img"
      aria-label="North Indian Kundali"
    >
      {/* Background */}
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="#FFF8E7" />

      {/* Region polygons (subtle alternating fill for legibility) */}
      {REGIONS.map((r) => (
        <path
          key={`fill-${r.house}`}
          d={polyPath(r.poly)}
          fill={r.house % 2 === 0 ? '#FBEFD8' : '#FFF8E7'}
          stroke="none"
        />
      ))}

      {/* Outer square */}
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="none" stroke="#7B1E1E" strokeWidth={2} />
      {/* Outer diagonals */}
      <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke="#7B1E1E" strokeWidth={1.5} />
      <line x1={B.x} y1={B.y} x2={D.x} y2={D.y} stroke="#7B1E1E" strokeWidth={1.5} />
      {/* Inner diamond */}
      <path
        d={`M ${P.x} ${P.y} L ${Q.x} ${Q.y} L ${R.x} ${R.y} L ${S.x} ${S.y} Z`}
        fill="none"
        stroke="#7B1E1E"
        strokeWidth={1.5}
      />

      {/* Planet & house-number content */}
      {REGIONS.map((r) => {
        const planets = byHouse.get(r.house) ?? [];
        const rashi = rashiOfHouse(r.house);
        return (
          <g key={`txt-${r.house}`}>
            {/* Sign number — small, near a "corner" of the region */}
            <text
              x={r.label.x}
              y={r.label.y - 18}
              textAnchor="middle"
              fontSize={9}
              fill="#7B1E1E"
              opacity={0.55}
            >
              {rashi}
            </text>
            {/* Planet abbreviations stacked */}
            {planets.map((p, i) => {
              const cols = planets.length > 3 ? 2 : 1;
              const col = i % cols;
              const row = Math.floor(i / cols);
              const dx = (col - (cols - 1) / 2) * 22;
              const dy = row * 12;
              const fill = p.id === 'SU' ? '#C2410C'
                          : p.id === 'MO' ? '#4338CA'
                          : p.id === 'MA' ? '#B91C1C'
                          : p.id === 'ME' ? '#047857'
                          : p.id === 'JU' ? '#B45309'
                          : p.id === 'VE' ? '#9D174D'
                          : p.id === 'SA' ? '#1F2937'
                          : p.id === 'RA' ? '#374151'
                          : '#374151';
              return (
                <text
                  key={p.id}
                  x={r.label.x + dx}
                  y={r.label.y + dy + 2}
                  textAnchor="middle"
                  fontSize={11}
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

      {/* Lagna marker — small "AS" tag near H1 */}
      <text
        x={REGIONS[0].label.x}
        y={REGIONS[0].label.y + 28}
        textAnchor="middle"
        fontSize={8}
        fontStyle="italic"
        fill="#7B1E1E"
        opacity={0.7}
      >
        {t('common.lagna', 'Lagna')}
      </text>
    </svg>
  );
}
