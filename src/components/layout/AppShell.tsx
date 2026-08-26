import type { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

type AppShellProps = { firstName: string; onLogout(): void; children: ReactNode };

export function AppShell({ firstName, onLogout, children }: AppShellProps) {
  return <div className="app-layout"><AppSidebar firstName={firstName} onLogout={onLogout} /><main className="app-page">{children}</main></div>;
}
