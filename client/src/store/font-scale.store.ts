// Global font-zoom store. Multiplies the root <html> font-size so every
// rem-based Tailwind class (text-xs, text-sm, text-base, etc.) and every
// `em`-based UI scales together. Persisted to localStorage so the user's
// preferred zoom survives reloads.
//
// The active scale is also applied to a CSS custom property `--font-scale`
// on the root, which is referenced from `index.css` to compute html's
// font-size. We additionally use Electron's built-in zoom hook when the
// app runs inside the desktop shell — that scales pixel-based UI too.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Discrete zoom levels — 100 % is the design baseline. Going beyond ±40%
 *  starts breaking layouts so we cap there. */
export const FONT_SCALES = [0.85, 0.9, 1, 1.1, 1.2, 1.35, 1.5] as const;
export type FontScale = (typeof FONT_SCALES)[number];

interface FontScaleState {
  scale: FontScale;
  setScale: (s: FontScale) => void;
  /** Bump up to the next discrete level (no-op at the top). */
  zoomIn: () => void;
  /** Bump down to the previous level (no-op at the bottom). */
  zoomOut: () => void;
  /** Reset to 100 %. */
  reset: () => void;
}

export const useFontScale = create<FontScaleState>()(
  persist(
    (set, get) => ({
      scale: 1,
      setScale: (s) => set({ scale: s }),
      zoomIn: () => {
        const cur = get().scale;
        const idx = FONT_SCALES.indexOf(cur);
        const next = FONT_SCALES[Math.min(FONT_SCALES.length - 1, idx + 1)];
        set({ scale: next });
      },
      zoomOut: () => {
        const cur = get().scale;
        const idx = FONT_SCALES.indexOf(cur);
        const next = FONT_SCALES[Math.max(0, idx - 1)];
        set({ scale: next });
      },
      reset: () => set({ scale: 1 }),
    }),
    {
      name: 'jyotishpro.font-scale.v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Apply the current scale to the document root + Electron webContents.
 *  Call from the React effect that owns the <html> element. */
export function applyFontScale(scale: number) {
  const root = document.documentElement;
  root.style.setProperty('--font-scale', String(scale));
}

