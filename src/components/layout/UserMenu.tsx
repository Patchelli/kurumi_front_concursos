import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type UserMenuProps = { firstName: string; onLogout(): void };

export function UserMenu({ firstName, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="hub-user-menu" ref={ref}>
      <button type="button" className="hub-profile" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="menu">
        <span className="hub-avatar">{firstName.charAt(0).toUpperCase()}</span>
        <span className="hub-profile-name">{firstName}</span>
        <span className="hub-profile-chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="hub-user-dropdown" role="menu">
          <Link to="/perfil" className="hub-dropdown-item" onClick={() => setOpen(false)} role="menuitem">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            Perfil
          </Link>
          <button type="button" className="hub-dropdown-item hub-dropdown-logout" onClick={onLogout} role="menuitem">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17v2H5V5h5v2H7v10h3Zm4.59-10.41L20 12l-5.41 5.41L13.17 16l3-3H9v-2h7.17l-3-3 1.42-1.41Z"/></svg>
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
