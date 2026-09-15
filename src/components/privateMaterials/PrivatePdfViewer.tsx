import { useEffect, useMemo, useRef, useState } from 'react';
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
    const render = async () => { const pdfPage = await document.getPage(page); const base = pdfPage.getViewport({ scale: 1, rotation }); const width = Math.max(280, stageRef.current?.clientWidth ?? 280); const viewport = pdfPage.getViewport({ scale: width / base.width, rotation }); const canvas = canvasRef.current; const canvasContext = canvas?.getContext('2d'); if (!canvas || !canvasContext || cancelled) return; canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height); canvas.style.width = `${Math.floor(viewport.width)}px`; canvas.style.height = `${Math.floor(viewport.height)}px`; await pdfPage.render({ canvasContext, viewport }).promise; };
    void render(); const observer = new ResizeObserver(() => { void render(); }); observer.observe(stageRef.current); return () => { cancelled = true; observer.disconnect(); };
  }, [document, page, rotation, mobile]);
  if (!mobile) return <div className="cv-overlay"><div className="cv-shell"><div className="cv-bar"><span className="cv-title">{title}</span><button className="cv-close" onClick={onClose}>×</button></div><iframe className="cv-frame cv-frame--visible" title={title} src={objectUrl} /></div></div>;
  return <div className="cv-overlay pm-pdf-overlay"><div className="cv-shell pm-pdf-shell"><div className="cv-bar"><span className="cv-title">{title}</span><button className="cv-close" onClick={onClose}>×</button></div><div ref={stageRef} className="pm-pdf-stage">{error ? <p>Não foi possível abrir este PDF.</p> : !document ? <p>Carregando PDF…</p> : <canvas ref={canvasRef} />}</div>{document && <footer className="pm-pdf-controls"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>← Anterior</button><span>Página {page} de {document.numPages}</span><button type="button" onClick={() => setRotation(value => (value + 90) % 360)} aria-label="Girar página">↻</button><button type="button" disabled={page === document.numPages} onClick={() => setPage(value => value + 1)}>Próxima →</button></footer>}</div></div>;
}
