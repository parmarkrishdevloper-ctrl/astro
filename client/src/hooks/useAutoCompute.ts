// Auto-compute hook — pages that take a BirthInput call this on mount so the
// user doesn't have to click "Generate" again after entering details once.
//
//   const { autoSubmitted } = useAutoCompute(handleSubmit);
//
// If the active-chart store has a chart, fires `handleSubmit(active)` exactly
// once after the component mounts. Pages that want different behaviour can
// pass `enabled: false` to opt out.

import { useEffect, useRef } from 'react';
import type { BirthInput } from '../types';
import { useActiveChart } from '../store/active-chart.store';

interface Options {
  /** Disable auto-compute (e.g. when a page wants the user to always click Generate). */
  enabled?: boolean;
  /** Re-fire when the active chart reference changes (default true). */
  refireOnChange?: boolean;
}

/** Returns `{ active, autoSubmitted }`. The submitter is invoked at most once
 *  per active-chart reference unless `refireOnChange` is true. */
export function useAutoCompute(
  submitter: (input: BirthInput) => void,
  opts: Options = {},
): { active: BirthInput | null; autoSubmitted: boolean } {
  const { enabled = true, refireOnChange = true } = opts;
  const active = useActiveChart((s) => s.active);
  const lastFiredFor = useRef<BirthInput | null>(null);
  const submittedAtLeastOnce = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!active) return;
    // Skip if we've already fired for this exact reference (re-render churn).
    if (!refireOnChange && submittedAtLeastOnce.current) return;
    if (lastFiredFor.current === active) return;
    lastFiredFor.current = active;
    submittedAtLeastOnce.current = true;
    submitter(active);
  }, [active, enabled, refireOnChange, submitter]);

  return { active, autoSubmitted: submittedAtLeastOnce.current };
}
