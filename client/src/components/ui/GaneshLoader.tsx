// Reusable Ganesh-themed loader for in-app data fetches.
//
// Usage:
//   {loading && <GaneshLoader message={t('classic.computing', 'Computing all panels…')} />}
//
// Three sizes: 'sm' (inline button-row spinner), 'md' (default card-body filler),
// 'lg' (full-section overlay). The graphic mirrors the boot loader in
// index.html — same circular gold-bordered photo with a halo pulse, with a
// graceful Om-symbol fallback when /ganesh.png isn't present.

import { useState } from 'react';

interface Props {
  message?: string;
  /** sm = 56px disc, md = 96px (default), lg = 144px */
  size?: 'sm' | 'md' | 'lg';
  /** Mantra shown above the message; pass '' to suppress. */
  mantra?: string;
  className?: string;
}

const SIZES = {
  sm: { disc: 56,  font: 36, spacing: 'gap-2'  },
  md: { disc: 96,  font: 64, spacing: 'gap-3'  },
  lg: { disc: 144, font: 96, spacing: 'gap-4'  },
};

export function GaneshLoader({
  message,
  size = 'md',
  mantra = 'श्री गणेशाय नमः',
  className = '',
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const dims = SIZES[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading'}
      className={`flex flex-col items-center justify-center text-center py-8 ${dims.spacing} ${className}`}
    >
      <div
        className="ganesh-loader-frame relative"
        style={{ width: dims.disc + 24, height: dims.disc + 24 }}
      >
        {/* Soft golden halo */}
        <div
          className="ganesh-loader-halo absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(230,154,35,0.45) 0%, rgba(230,154,35,0) 70%)',
            filter: 'blur(6px)',
          }}
        />
        {/* Image disc */}
        <div
          className="ganesh-loader-disc relative mx-auto rounded-full overflow-hidden"
          style={{
            width: dims.disc,
            height: dims.disc,
            top: 12,
            background: 'var(--vedic-cream, #FFF8E7)',
            boxShadow:
              '0 0 0 3px #C9A24F, 0 0 0 6px #FFF8E7, 0 0 0 7px rgba(123,30,30,0.4), 0 8px 20px rgba(123,30,30,0.18)',
          }}
        >
          {!imgFailed ? (
            <img
              src="/ganesh.png"
              alt="Lord Ganesha"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-bold"
              style={{
                fontSize: dims.font,
                lineHeight: 1,
                color: '#E69A23',
                background: 'radial-gradient(circle at 50% 60%, #FFE9A6 0%, #FFD37A 60%, #FFF8E7 100%)',
                textShadow: '0 4px 12px rgba(123,30,30,0.30)',
                fontFamily: '"Noto Sans Devanagari", serif',
              }}
              aria-hidden="true"
            >
              ॐ
            </div>
          )}
        </div>
      </div>

      {mantra && (
        <h3
          className="text-vedicMaroon font-bold tracking-wide"
          style={{
            fontFamily: '"Noto Sans Devanagari", "Fraunces", serif',
            fontSize: size === 'lg' ? 22 : size === 'md' ? 16 : 13,
          }}
        >
          {mantra}
        </h3>
      )}
      {message && (
        <p
          className="text-vedicMaroon/60 italic"
          style={{ fontSize: size === 'sm' ? 11 : 12 }}
        >
          {message}
        </p>
      )}

      {/* Three-dot wave */}
      <div className="flex gap-1.5 mt-1" aria-hidden="true">
        <span className="ganesh-loader-dot" />
        <span className="ganesh-loader-dot" style={{ animationDelay: '0.15s' }} />
        <span className="ganesh-loader-dot" style={{ animationDelay: '0.30s' }} />
      </div>
    </div>
  );
}
