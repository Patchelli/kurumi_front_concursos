import { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export function PrivatePdfViewer({ url, title, onClose }: { url: string; title: string; onClose(): void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const stageRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null); const [page, setPage] = useState(1); const [rotation, setRotation] = useState(0); const [error, setError] = useState(false);
  useEffect(() => { const media = window.matchMedia('(pointer: coarse)'); const update = () => setMobile(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { if (!mobile) return; const task = getDocument({ url }); task.promise.then(setDocument).catch(() => setError(true)); return () => { void task.destroy(); }; }, [url, mobile]);
  useEffect(() => {
    if (!mobile || !document || !canvasRef.current || !stageRef.current) return;
    let cancelled = false;
    const render = async () => { const pdfPage = await document.getPage(page); const base = pdfPage.getViewport({ scale: 1, rotation }); const width = Math.max(280, stageRef.current?.clientWidth ?? 280); const viewport = pdfPage.getViewport({ scale: width / base.width, rotation }); const canvas = canvasRef.current; if (!canvas || cancelled) return; canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height); canvas.style.width = `${Math.floor(viewport.width)}px`; canvas.style.height = `${Math.floor(viewport.height)}px`; await pdfPage.render({ canvas, viewport }).promise; };
    void render(); const observer = new ResizeObserver(() => { void render(); }); observer.observe(stageRef.current); return () => { cancelled = true; observer.disconnect(); };
  }, [document, page, rotation, mobile]);
  if (!mobile) return <div className="cv-overlay"><div className="cv-shell"><div className="cv-bar"><span className="cv-title">{title}</span><button className="cv-close" onClick={onClose}>×</button></div><iframe className="cv-frame cv-frame--visible" title={title} src={url} /></div></div>;
  return <div className="cv-overlay pm-pdf-overlay"><div className="cv-shell pm-pdf-shell"><div className="cv-bar"><span className="cv-title">{title}</span><button className="cv-close" onClick={onClose}>×</button></div><div ref={stageRef} className="pm-pdf-stage">{error ? <p>Não foi possível abrir este PDF.</p> : !document ? <p>Carregando PDF…</p> : <canvas ref={canvasRef} />}</div>{document && <footer className="pm-pdf-controls"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>← Anterior</button><span>Página {page} de {document.numPages}</span><button type="button" onClick={() => setRotation(value => (value + 90) % 360)} aria-label="Girar página">↻</button><button type="button" disabled={page === document.numPages} onClick={() => setPage(value => value + 1)}>Próxima →</button></footer>}</div></div>;
}
