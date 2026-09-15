import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function readBlob(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível ler o PDF.'));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
}

export function PrivatePdfViewer({ file, title, onClose }: { file: Blob; title: string; onClose(): void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const stageRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 768px), (pointer: coarse)').matches);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null); const [page, setPage] = useState(1); const [rotation, setRotation] = useState(0); const [error, setError] = useState(false);
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl]);
  useEffect(() => { const media = window.matchMedia('(max-width: 768px), (pointer: coarse)'); const update = () => setMobile(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => {
    if (!mobile) return;
    let active = true;
    setError(false); setDocument(null); setPage(1);
    let task: ReturnType<typeof getDocument> | null = null;
    void readBlob(file).then(data => {
      if (!active) return;
      task = getDocument({ data });
      return task.promise.then(pdf => { if (active) setDocument(pdf); });
    }).catch(reason => { if (active && reason?.name !== 'AbortException') { console.error('Falha ao processar PDF privado:', reason); setError(true); } });
    return () => { active = false; if (task) void task.destroy(); };
  }, [file, mobile]);
  useEffect(() => {
    if (!mobile || !document || !canvasRef.current || !stageRef.current) return;
    let cancelled = false;
    const render = async () => { const pdfPage = await document.getPage(page); const base = pdfPage.getViewport({ scale: 1, rotation }); const width = Math.max(1, (stageRef.current?.clientWidth ?? 1) - 16); const height = Math.max(1, (stageRef.current?.clientHeight ?? 1) - 16); const viewport = pdfPage.getViewport({ scale: Math.max(.1, Math.min(width / base.width, height / base.height)), rotation }); const canvas = canvasRef.current; const canvasContext = canvas?.getContext('2d'); if (!canvas || !canvasContext || cancelled) return; canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height); canvas.style.width = `${Math.floor(viewport.width)}px`; canvas.style.height = `${Math.floor(viewport.height)}px`; await pdfPage.render({ canvasContext, viewport }).promise; };
    void render(); const observer = new ResizeObserver(() => { void render(); }); observer.observe(stageRef.current); return () => { cancelled = true; observer.disconnect(); };
  }, [document, page, rotation, mobile]);
  if (!mobile) return <div className="cv-overlay"><div className="cv-shell"><div className="cv-bar"><span className="cv-title">{title}</span><button className="cv-close" onClick={onClose}>×</button></div><iframe className="cv-frame cv-frame--visible" title={title} src={objectUrl} /></div></div>;
  const previous = () => setPage(value => Math.max(1, value - 1));
  const next = () => setPage(value => Math.min(document?.numPages ?? value, value + 1));
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => { const start = touchStart.current; touchStart.current = null; if (!start) return; const x = event.changedTouches[0]?.clientX ?? start.x; const y = event.changedTouches[0]?.clientY ?? start.y; const deltaX = x - start.x; if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(y - start.y)) deltaX < 0 ? next() : previous(); };
  return <div className="cv-overlay pm-pdf-overlay"><div className="cv-shell pm-pdf-shell"><div className="cv-bar"><span className="cv-title">{title}</span><button className="cv-close" onClick={onClose}>×</button></div><div ref={stageRef} className="pm-pdf-stage" onTouchStart={event => { const touch = event.touches[0]; if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={handleTouchEnd}>{error ? <p>Não foi possível abrir este PDF.</p> : !document ? <p>Carregando PDF…</p> : <><canvas ref={canvasRef} /><button className="pm-pdf-nav pm-pdf-nav--previous" type="button" disabled={page === 1} onClick={previous} aria-label="Página anterior">‹</button><button className="pm-pdf-nav pm-pdf-nav--next" type="button" disabled={page === document.numPages} onClick={next} aria-label="Próxima página">›</button></>}</div>{document && <footer className="pm-pdf-controls"><span>Deslize para trocar · Página {page} de {document.numPages}</span><button type="button" onClick={() => setRotation(value => (value + 90) % 360)} aria-label="Girar página">↻</button></footer>}</div></div>;
}
