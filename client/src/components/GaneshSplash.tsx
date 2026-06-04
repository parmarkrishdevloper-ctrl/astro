// Ganesh / OM splash overlay.
//
// Behavior:
//   • Shows once per browser-tab session (sessionStorage flag).
//   • Auto-dismisses after 1.5 s with a smooth fade-out.
//   • User can close early with the ✕ button, the backdrop, or Esc.
//   • Once dismissed (auto or manual), the flag is set so it does NOT
//     reappear on subsequent route navigations within the same tab.
//
// The boot-time HTML splash in index.html still paints instantly on cold
// load, so this React component does NOT replace the first-paint feel —
// it just guarantees the splash is shown once per tab session and never
// blocks navigation thereafter.

import { useEffect, useState } from 'react';

const SESSION_KEY = 'jyotish:ganeshSplash:shown';
const AUTO_DISMISS_MS = 1500;
const FADE_MS = 400;

export function GaneshSplash() {
  // Read sessionStorage synchronously on first render so we never show
  // the splash on tab navigations that already dismissed it.
  const [shouldRender, setShouldRender] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && !window.sessionStorage.getItem(SESSION_KEY);
    } catch {
      // sessionStorage can throw in some incognito / sandbox modes — just skip.
      return false;
    }
  });
  const [isHiding, setIsHiding] = useState(false);

  // Mark as shown immediately so a second mount (StrictMode, hot reload,
  // navigation) never re-displays this overlay.
  useEffect(() => {
    if (!shouldRender) return;
    try { window.sessionStorage.setItem(SESSION_KEY, '1'); } catch {/* ignore */}
  }, [shouldRender]);

  // Auto-dismiss after 1.5 s.
  useEffect(() => {
    if (!shouldRender) return;
    const t = window.setTimeout(() => beginHide(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRender]);

  // Esc key dismisses.
  useEffect(() => {
    if (!shouldRender) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginHide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRender]);

  function beginHide() {
    setIsHiding(true);
    window.setTimeout(() => setShouldRender(false), FADE_MS);
  }

  if (!shouldRender) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="श्री गणेशाय नमः"
      onClick={beginHide}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #FFFAEC 0%, #FFF8E7 60%, #F5E6BE 100%)',
        fontFamily: "'Noto Sans Devanagari', 'Fraunces', serif",
        color: '#7B1E1E',
        opacity: isHiding ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        cursor: 'pointer',
      }}
    >
      {/* Close button — stops propagation so the backdrop click doesn't also fire. */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); beginHide(); }}
        aria-label="Close splash"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid rgba(123,30,30,0.3)',
          background: 'rgba(255,255,255,0.7)',
          color: '#7B1E1E',
          fontSize: 18,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }}
      >✕</button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 200,
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          cursor: 'default',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -16,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,154,35,0.45) 0%, rgba(230,154,35,0) 70%)',
            filter: 'blur(8px)',
          }}
        />
        <div
          style={{
            position: 'relative',
            width: 168,
            height: 168,
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#FFF8E7',
            boxShadow:
              '0 0 0 4px #C9A24F, 0 0 0 8px #FFF8E7, 0 0 0 10px rgba(123,30,30,0.45), 0 12px 32px rgba(123,30,30,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GaneshImage />
        </div>
      </div>

      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: '#7B1E1E',
          margin: '0 0 6px 0',
        }}
      >श्री गणेशाय नमः</h1>
      <p
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 13,
          color: 'rgba(123,30,30,0.65)',
          letterSpacing: '0.5px',
          margin: '0 0 4px 0',
        }}
      >ज्योतिषी हेमराज लड्ढा · वैदिक ज्योतिष सूट</p>
      <p
        style={{
          fontSize: 11,
          color: 'rgba(123,30,30,0.45)',
          margin: '8px 0 0 0',
        }}
      >हटाने के लिए कहीं भी क्लिक करें या Esc दबाएँ</p>
    </div>
  );
}

// Renders /ganesh.png with a graceful Om-symbol fallback when the image
// isn't present in the public folder.
function GaneshImage() {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 110,
          lineHeight: 1,
          color: '#E69A23',
          background: 'radial-gradient(circle at 50% 60%, #FFE9A6 0%, #FFD37A 60%, #FFF8E7 100%)',
          fontWeight: 700,
          textShadow: '0 4px 16px rgba(123,30,30,0.35)',
        }}
      >ॐ</div>
    );
  }
  return (
    <img
      src="/ganesh.png"
      alt="Lord Ganesha"
      onError={() => setErrored(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}
