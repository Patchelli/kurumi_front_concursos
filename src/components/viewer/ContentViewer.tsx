import { useRef, useState } from 'react';

type Status = 'loading' | 'ok' | 'blocked';

export function ContentViewer({ url, title, onClose }: { url: string; title: string; onClose(): void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  function handleLoad() {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || !doc.body || doc.body.innerHTML.trim() === '') {
        // Same-origin empty body → likely blocked
        setStatus('blocked');
        return;
      }
      // Same-origin with content → loaded fine
      setStatus('ok');
    } catch {
      // Cross-origin → can't check; show iframe but with fallback banner
      // Some cross-origin sites load fine, others are blocked — we can't tell
      setStatus('ok');

      // Use a heuristic: try to detect if iframe is really blank
      // by checking its dimensions after a short delay
      setTimeout(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        try {
          // If we still can't access contentWindow.length, it might be blocked
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          iframe.contentWindow?.length;
        } catch {
          setStatus('blocked');
        }
      }, 2000);
    }
  }

  function handleError() {
    setStatus('blocked');
  }

  let hostname = url;
  try { hostname = new URL(url).hostname; } catch { /* keep original */ }

  return (
    <div className="cv-overlay" onMouseDown={e => e.currentTarget === e.target && onClose()}>
      <div className="cv-shell">
        <div className="cv-bar">
          <span className="cv-title" title={url}>{title || hostname}</span>
          <div className="cv-bar-actions">
            <a className="cv-external" href={url} target="_blank" rel="noopener noreferrer">↗ Abrir em nova aba</a>
            <button className="cv-close" type="button" onClick={onClose} aria-label="Fechar">×</button>
          </div>
        </div>

        {status === 'loading' && <div className="cv-loading"><span>Carregando…</span></div>}

        {status === 'blocked' && (
          <div className="cv-blocked">
            <span className="cv-blocked-icon" aria-hidden="true">🔒</span>
            <strong>Este site não permite visualização embutida</strong>
            <p>O site <b>{hostname}</b> bloqueia a exibição dentro de outros sites.</p>
            <a className="cv-blocked-open" href={url} target="_blank" rel="noopener noreferrer">
              Abrir em nova aba →
            </a>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={url}
          title={title || 'Conteúdo externo'}
          className={`cv-frame${status === 'ok' ? ' cv-frame--visible' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
