import { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export function PrivatePdfViewer({ url, title, onClose }: { url: string; title: string; onClose(): void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const stageRef = useRef<HTMLDivElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null); const [page, setPage] = useState(1); const [error, setError] = useState(false);
  useEffect(() => { const task = getDocument({ url }); task.promise.then(setDocument).catch(() => setError(true)); return () => { void task.destroy(); }; }, [url]);
  useEffect(() => {
    if (!document || !canvasRef.current || !stageRef.current) return;
    let cancelled = false;
    const render = async () => { const pdfPage = await document.getPage(page); const base = pdfPage.getViewport({ scale: 1 }); const width = Math.max(280, stageRef.current?.clientWidth ?? 280); const scale = width / base.width; const viewport = pdfPage.getViewport({ scale }); const canvas = canvasRef.current; if (!canvas || cancelled) return; const ratio = window.devicePixelRatio || 1; canvas.width = Math.floor(viewport.width * ratio); canvas.height = Math.floor(viewport.height * ratio); canvas.style.width = `${Math.floor(viewport.width)}px`; canvas.style.height = `${Math.floor(viewport.height)}px`; await pdfPage.render({ canvas, viewport }).promise; };
    void render(); const observer = new ResizeObserver(() => { void render(); }); observer.observe(stageRef.current); return () => { cancelled = true; observer.disconnect(); };
  }, [document, page]);
  return <div className="cv-overlay pm-pdf-overlay"><div className="cv-shell pm-pdf-shell"><div className="cv-bar"><span className="cv-title">{title}</span><button className="cv-close" onClick={onClose}>×</button></div><div ref={stageRef} className="pm-pdf-stage">{error ? <p>Não foi possível abrir este PDF.</p> : !document ? <p>Carregando PDF…</p> : <canvas ref={canvasRef} />}</div>{document && <footer className="pm-pdf-controls"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>← Anterior</button><span>Página {page} de {document.numPages}</span><button type="button" disabled={page === document.numPages} onClick={() => setPage(value => value + 1)}>Próxima →</button></footer>}</div></div>;
}
