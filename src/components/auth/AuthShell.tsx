import type { ReactNode } from 'react';
import { BrandLockup } from '../brand/BrandLockup';

type AuthShellProps = {
  children: ReactNode;
  caption: string;
  title: ReactNode;
};

export function AuthShell({ children, caption, title }: AuthShellProps) {
  return (
    <main className="auth-layout">
      <section className="auth-hero">
        <BrandLockup inverse />
        <div className="auth-message">
          <span className="eyebrow">ESTUDO INTELIGENTE</span>
          <h1>{title}</h1>
          <p>{caption}</p>
        </div>
        <div className="hero-feature">
          <span className="feature-icon" aria-hidden="true">✓</span>
          <div>
            <strong>Seu progresso sempre com você</strong>
            <span>Dados sincronizados com segurança no banco.</span>
          </div>
        </div>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
