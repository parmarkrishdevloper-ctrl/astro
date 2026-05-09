// useClipboardPaste — one-shot read of the system clipboard via
// navigator.clipboard.readText(). Reports a supported flag and the last error.
// Also returns a parseBirth() convenience that extracts an ISO datetime, lat,
// lng, and optional place from a pasted string. Works with:
//   • ISO datetime strings
//   • "lat, lng" pairs
//   • Google Maps URLs (?q=lat,lng  or  /@lat,lng,15z)
//
// Callers can pick-and-choose which pieces they need from the returned struct.

import { useCallback, useState } from 'react';

export interface ParsedClipboard {
  raw: string;
  datetime?: string;       // ISO
  lat?: number;
  lng?: number;
  place?: string;
}

const ISO_RE = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?/;
const LATLNG_RE = /(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/;
const GMAPS_AT_RE = /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/;
const GMAPS_Q_RE  = /[?&]q=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/;

export function parseBirthFromText(raw: string): ParsedClipboard {
  const out: ParsedClipboard = { raw };

  const iso = raw.match(ISO_RE)?.[0];
  if (iso) out.datetime = iso.replace(' ', 'T');

  const g1 = raw.match(GMAPS_AT_RE);
  const g2 = !g1 && raw.match(GMAPS_Q_RE);
  const g3 = !g1 && !g2 && raw.match(LATLNG_RE);
  const m = g1 || g2 || g3;
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      out.lat = lat;
      out.lng = lng;
    }
  }

  // Pull place name heuristically: any "Place: NAME" or "at NAME" blob.
  const place = raw.match(/(?:place|at|born in)\s*[:\-]?\s*([A-Z][\w\s,.-]{2,60})/i);
  if (place) out.place = place[1].trim();

  return out;
}

export function useClipboardPaste() {
  const supported = typeof navigator !== 'undefined'
    && !!navigator.clipboard
    && typeof navigator.clipboard.readText === 'function';
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const read = useCallback(async (): Promise<string> => {
    if (!supported) { setError('Clipboard read not supported.'); return ''; }
    setBusy(true);
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (e: any) {
      setError(e?.message ?? 'Clipboard permission denied.');
      return '';
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const pasteAndParse = useCallback(async (): Promise<ParsedClipboard | null> => {
    const raw = await read();
    if (!raw) return null;
    return parseBirthFromText(raw);
  }, [read]);

  return { supported, busy, error, read, pasteAndParse };
}
