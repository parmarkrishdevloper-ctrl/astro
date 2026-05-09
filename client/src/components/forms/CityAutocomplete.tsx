// City autocomplete — instant offline hits from the bundled CITIES list,
// plus debounced online lookup via /api/geo/cities (OpenStreetMap Nominatim)
// so every village/town worldwide is reachable. Falls back to free-form
// text when offline or the geocoder is unreachable.

import { useEffect, useRef, useState } from 'react';
import { CITIES, searchCities, City } from '../../data/cities';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onCitySelect: (city: City) => void;
  placeholder?: string;
  className?: string;
}

function mergeHits(offline: City[], online: City[], limit = 12): City[] {
  const seen = new Set<string>();
  const out: City[] = [];
  const key = (c: City) =>
    `${c.name.toLowerCase()}|${c.lat.toFixed(2)}|${c.lng.toFixed(2)}`;
  for (const c of offline) {
    const k = key(c);
    if (!seen.has(k)) { seen.add(k); out.push(c); }
    if (out.length >= limit) return out;
  }
  for (const c of online) {
    const k = key(c);
    if (!seen.has(k)) { seen.add(k); out.push(c); }
    if (out.length >= limit) return out;
  }
  return out;
}

export function CityAutocomplete({
  value, onChange, onCitySelect, placeholder, className,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [online, setOnline] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  const offlineHits = focused ? searchCities(value, 10) : [];
  const hits = focused ? mergeHits(offlineHits, online, 15) : [];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const q = value.trim();
    if (!focused || q.length < 2) {
      setOnline([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/geo/cities?q=${encodeURIComponent(q)}&limit=15`);
        if (!r.ok) throw new Error(`geo ${r.status}`);
        const data = await r.json();
        if (id !== reqId.current) return;
        setOnline(Array.isArray(data.hits) ? data.hits : []);
      } catch {
        if (id === reqId.current) setOnline([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [value, focused]);

  function pick(c: City) {
    onChange(`${c.name}, ${c.admin}${c.country !== 'IN' ? `, ${c.country}` : ''}`);
    onCitySelect(c);
    setFocused(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!focused || hits.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); pick(hits[active]); }
    else if (e.key === 'Escape') { setFocused(false); }
  }

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setFocused(true); setActive(0); }}
        onFocus={() => setFocused(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? 'Type a city — Delhi, Mumbai, New York…'}
        className="input"
        autoComplete="off"
      />
      {focused && (hits.length > 0 || loading) && (
        <div className="absolute z-30 mt-1 left-0 right-0 rounded-lg shadow-lg overflow-hidden"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
          <ul className="max-h-[280px] overflow-y-auto">
            {hits.map((c, i) => (
              <li key={`${c.name}-${c.admin}-${c.lat}-${c.lng}-${i}`}>
                <button type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(c)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-3 ${
                    i === active ? 'bg-vedicMaroon/10' : 'hover:bg-parchment'
                  }`}>
                  <div className="min-w-0">
                    <div className="font-semibold truncate" style={{ color: 'var(--text-strong)' }}>
                      {c.name}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {c.admin}{c.country && c.country !== 'IN' ? `, ${c.country}` : ''}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-right flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>
                    <div>{c.lat.toFixed(3)}, {c.lng.toFixed(3)}</div>
                    <div>TZ {c.tz >= 0 ? '+' : ''}{c.tz}</div>
                  </div>
                </button>
              </li>
            ))}
            {loading && hits.length === 0 && (
              <li className="px-3 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                Searching worldwide…
              </li>
            )}
          </ul>
          <div className="px-3 py-1.5 text-[10px] border-t flex justify-between"
            style={{ background: 'var(--surface-2)', color: 'var(--text-subtle)', borderColor: 'var(--border-subtle)' }}>
            <span>↑↓ navigate · ↵ select · Esc dismiss</span>
            <span>{CITIES.length} offline · online lookup {loading ? '…' : 'ready'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
