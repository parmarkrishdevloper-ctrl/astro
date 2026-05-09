import { ReactNode } from 'react';

export function Card({
  title, children, action, className = '', padded = true,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <header className="card-header">
          <h3 className="card-header-title">{title}</h3>
          {action}
        </header>
      )}
      <div className={padded ? 'card-body' : ''}>{children}</div>
    </section>
  );
}

export function PageShell({
  title, subtitle, actions, children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="page-hero">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="page-hero-title">{title}</h2>
            {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
      <div className="px-5 md:px-8 py-6 flex-1">
        <div className="mx-auto" style={{ maxWidth: 'var(--content-max)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'good' | 'bad' | 'warn' | 'neutral' | 'info';
  children: ReactNode;
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border px-4 py-3 text-sm"
      style={{
        background: 'color-mix(in srgb, #B91C1C 8%, transparent)',
        borderColor: 'color-mix(in srgb, #B91C1C 30%, transparent)',
        color: '#B91C1C',
      }}>
      <strong className="font-semibold">Error:</strong> {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="card-body text-center text-sm italic"
      style={{
        background: 'var(--surface-2)',
        border: '1px dashed var(--border-soft)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--text-muted)',
        padding: '40px 24px',
      }}>
      {children}
    </div>
  );
}
