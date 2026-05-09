// Active-chart store — single source of truth for the birth details a user
// has currently "loaded". Every page that takes a `BirthInput` reads from
// here so the user enters details once and every analysis (kundali, dasha,
// muhurta, yoga, matching, etc.) operates on the same chart.
//
// Persisted to localStorage so the active chart survives reloads, and so a
// fresh tab opens to whatever the user last analysed.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BirthInput } from '../types';

interface ActiveChartState {
  /** Currently loaded birth details, or null when nothing has been entered. */
  active: BirthInput | null;
  /** Set the active chart (called from BirthDetailsForm on submit). */
  setActive: (input: BirthInput) => void;
  /** Clear the active chart — header "Clear" button + new-chart flow. */
  clear: () => void;
  /** Patch a few fields without losing the rest. */
  patch: (partial: Partial<BirthInput>) => void;
}

export const useActiveChart = create<ActiveChartState>()(
  persist(
    (set, get) => ({
      active: null,
      setActive: (input) => set({ active: input }),
      clear: () => set({ active: null }),
      patch: (partial) => {
        const cur = get().active;
        if (!cur) {
          // Treat patch on empty as a fresh set if minimum fields are present.
          if (partial.datetime != null && partial.lat != null && partial.lng != null) {
            set({ active: partial as BirthInput });
          }
          return;
        }
        set({ active: { ...cur, ...partial } });
      },
    }),
    {
      // Versioned key so we can bump on schema changes without crashing old data.
      name: 'jyotishpro.active-chart.v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Convenience selector — true when a chart is loaded and ready to use. */
export const hasActiveChart = (): boolean => useActiveChart.getState().active !== null;
