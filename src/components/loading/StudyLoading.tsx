import { useEffect, useState } from 'react';

type StudyLoadingProps = {
  label?: string;
  variant?: 'page' | 'section';
  delayMs?: number;
};

export function StudyLoading({
  label = 'Preparando seus estudos…',
  variant = 'page',
  delayMs,
}: StudyLoadingProps) {
  const resolvedDelay = delayMs ?? (variant === 'page' ? 0 : 300);
  const [visible, setVisible] = useState(resolvedDelay === 0);

  useEffect(() => {
    if (resolvedDelay === 0) {
      setVisible(true);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), resolvedDelay);
    return () => window.clearTimeout(timer);
  }, [resolvedDelay]);

  if (!visible) return null;

  return (
    <div
      className={`study-loading study-loading--${variant}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="study-loading__book" aria-hidden="true">
        <span className="study-loading__page study-loading__page--left" />
        <span className="study-loading__page study-loading__page--turning" />
        <span className="study-loading__page study-loading__page--right" />
        <span className="study-loading__spine" />
      </span>
      <span className="study-loading__label">{label}</span>
    </div>
  );
}
