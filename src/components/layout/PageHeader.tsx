import type { ReactNode } from 'react';

type PageHeaderProps = { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode };

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return <header className="app-page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="app-page-actions">{actions}</div>}</header>;
}
