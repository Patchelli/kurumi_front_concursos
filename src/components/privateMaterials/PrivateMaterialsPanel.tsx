import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { privateMaterialService, type NextcloudEntry, type PrivateMaterial, type PrivateMaterialOwner } from '@business/service/PrivateMaterial.service';
import { PrivatePdfViewer } from './PrivatePdfViewer';

type Props = { owner: PrivateMaterialOwner; ownerId: number };

export function PrivateMaterialsPanel({ owner, ownerId }: Props) {
  const [materials, setMaterials] = useState<PrivateMaterial[]>([]); const [loading, setLoading] = useState(true); const [pickerOpen, setPickerOpen] = useState(false); const [viewer, setViewer] = useState<string | null>(null);
  useEffect(() => { let active = true; setLoading(true); privateMaterialService.list(owner, ownerId).then(items => active && setMaterials(items)).catch(() => active && toast.error('Não foi possível carregar os materiais privados.')).finally(() => active && setLoading(false)); return () => { active = false; }; }, [owner, ownerId]);
  const remove = async (id: number) => { try { await privateMaterialService.remove(owner, ownerId, id); setMaterials(items => items.filter(item => item.id !== id)); } catch { toast.error('Não foi possível remover o material.'); } };
  const open = async (item: PrivateMaterial) => { try { setViewer(URL.createObjectURL(await privateMaterialService.file(owner, ownerId, item.id))); } catch { toast.error('Não foi possível abrir o PDF.'); } };
  return <>{loading && <p className="cv-form-hint">Carregando privados…</p>}{materials.map(item => <div key={`pm-${item.id}`} className="sp-material-item"><span>Privado</span><button className="sp-resource-open" type="button" onClick={() => void open(item)}><strong>{item.name}</strong><small>PDF do Nextcloud</small></button><button className="sp-resource-delete" type="button" onClick={() => void remove(item.id)} aria-label={`Remover ${item.name}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M3 6h18M8 6V4h8v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 5v6m4-6v6" /></svg></button></div>)}<button className="cv-add-material-btn" type="button" onClick={() => setPickerOpen(true)}>+ Vincular PDF do Nextcloud</button>{pickerOpen && createPortal(<NextcloudPicker owner={owner} ownerId={ownerId} onLinked={item => { setMaterials(items => [...items, item]); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />, document.body)}{viewer && createPortal(<PrivatePdfViewer url={viewer} title="PDF privado" onClose={() => { URL.revokeObjectURL(viewer); setViewer(null); }} />, document.body)}</>;
}

function NextcloudPicker({ owner, ownerId, onLinked, onClose }: Props & { onLinked(item: PrivateMaterial): void; onClose(): void }) {
  const [path, setPath] = useState<string>(); const [entries, setEntries] = useState<NextcloudEntry[]>([]); const [loading, setLoading] = useState(true);
  const load = (next?: string) => { setLoading(true); privateMaterialService.listFiles(next).then(setEntries).catch(() => toast.error('Não foi possível listar o Nextcloud.')).finally(() => setLoading(false)); setPath(next); };
  useEffect(() => { load(); }, []);
  const link = async (entry: NextcloudEntry) => { try { onLinked(await privateMaterialService.link(owner, ownerId, entry.path)); } catch { toast.error('Não foi possível vincular o PDF.'); } };
  return <div className="cv-overlay" onMouseDown={event => event.currentTarget === event.target && onClose()}><div className="cv-url-form pm-picker"><div className="cv-bar"><span className="cv-title">Vincular PDF do Nextcloud</span><button className="cv-close" onClick={onClose}>×</button></div><div className="cv-form-body pm-picker-body"><button className="pm-back" type="button" onClick={() => load(path?.split('/').slice(0, -1).join('/') || '/')}>← Pasta anterior</button>{loading ? <p className="cv-form-hint">Carregando…</p> : <div className="pm-picker-list">{entries.map(entry => <button className="pm-file-row" key={entry.path} type="button" onClick={() => entry.isDirectory ? load(entry.path) : void link(entry)}><span>{entry.isDirectory ? 'PASTA' : 'PDF'}</span><strong>{entry.name}</strong><small>{entry.isDirectory ? 'Abrir pasta' : 'Vincular PDF'}</small></button>)}</div>}</div></div></div>;
}
