import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MaterialDialog } from '../../../components/dialog/MaterialDialog';
import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import type { Capsule, TriggerCategory, TriggerType } from './Capsule.type';
import { capsuleTokens } from './Capsule.tokens';
import { useCapsuleDelivery } from './CapsuleDelivery.context';
import capsulaImg from '../../../assets/capsula.png';

/* ── Helpers ── */

function fmtDate(iso?: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function triggerDescription(capsule: Capsule): string {
  switch (capsule.triggerType) {
    case 'DATE': return `Entrega em ${fmtDate(capsule.scheduledAt)}`;
    case 'SUBJECT_COMPLETED': return `Conclusão de ${capsule.triggerReferenceLabel ?? 'a matéria'}`;
    case 'TOPIC_COMPLETED': return `Conclusão do tópico "${capsule.triggerReferenceLabel ?? ''}"`;
    case 'SUBTOPIC_COMPLETED': return `Conclusão do subtópico "${capsule.triggerReferenceLabel ?? ''}"`;
    case 'STUDY_HOURS_REACHED': return `${capsule.triggerValue ?? 0} horas estudadas`;
    case 'QUESTIONS_REACHED': return `${(capsule.triggerValue ?? 0).toLocaleString('pt-BR')} questões resolvidas`;
    case 'LEVEL_REACHED': return `Nível "${capsule.triggerReferenceLabel ?? ''}" alcançado`;
  }
}

function isYouTubeUrl(url: string): boolean {
  return /youtu\.be|youtube\.com\/watch|youtube\.com\/embed/.test(url);
}

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?rel=0&controls=0&modestbranding=1`;
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      return v ? `https://www.youtube-nocookie.com/embed/${v}?rel=0&controls=0&modestbranding=1` : url;
    }
  } catch { /* URL inválida */ }
  return url;
}

/* ── Space/Time Capsule SVG Icon ── */

function CapsuleIcon({ variant }: { variant: 'sealed' | 'arrived' | 'open' }) {
  return (
    <img
      src={capsulaImg}
      alt=""
      aria-hidden="true"
      className={`cp-capsule-img${variant === 'arrived' ? ' cp-capsule-img--arrived' : ''}${variant === 'open' ? ' cp-capsule-img--open' : ''}`}
    />
  );
}

/* ── Video player ── */

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch { /* noop */ }
  return null;
}

function VideoPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const ytId = isYouTubeUrl(url) ? getYouTubeId(url) : null;

  if (ytId) {
    if (playing) {
      return (
        <div className="cp-video-wrap">
          <iframe
            className="cp-video-iframe"
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
            title="Vídeo da cápsula"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <button className="cp-video-thumb" onClick={() => setPlaying(true)} aria-label="Reproduzir vídeo">
        <img
          src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
          alt="Thumbnail do vídeo"
          className="cp-video-thumb-img"
        />
        <span className="cp-video-play-btn" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </span>
      </button>
    );
  }

  return (
    <div className="cp-video-wrap">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video className="cp-video-native" src={url} controls />
    </div>
  );
}

/* ── Capsule Cards ── */

function ScheduledCard({ capsule }: { capsule: Capsule }) {
  return (
    <article className="cp-card cp-card--scheduled">
      <div className="cp-card-top">
        <span className="cp-chip cp-chip--scheduled">Agendada</span>
        <span className="cp-card-type-label">{capsuleTokens.triggerLabels[capsule.triggerType]}</span>
      </div>
      <div className="cp-capsule-center">
        <CapsuleIcon variant="sealed" />
      </div>
      <h3 className="cp-card-title">{capsule.title}</h3>
      <div className="cp-message-locked" aria-label="Mensagem oculta até a entrega">
        <span /><span /><span style={{ width: '65%' }} />
      </div>
      <footer className="cp-card-footer">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>{triggerDescription(capsule)}</span>
      </footer>
    </article>
  );
}

function DeliveredCard({ capsule, onReveal }: { capsule: Capsule; onReveal(): void }) {
  return (
    <article className="cp-card cp-card--delivered">
      <div className="cp-delivered-badge"><span aria-hidden="true">✦</span> Uma cápsula chegou</div>
      <div className="cp-capsule-center">
        <CapsuleIcon variant="arrived" />
      </div>
      <h3 className="cp-card-title">{capsule.title}</h3>
      <p className="cp-delivered-hint">Você tem uma mensagem esperando por você</p>
      <button className="cp-open-btn" type="button" onClick={onReveal}>
        Abrir cápsula <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

function OpenedCard({ capsule, onReread }: { capsule: Capsule; onReread(): void }) {
  const preview = capsule.message.length > 140 ? capsule.message.slice(0, 140) + '…' : capsule.message;
  return (
    <article className="cp-card cp-card--opened">
      <div className="cp-card-top">
        <span className="cp-chip cp-chip--opened">Aberta</span>
        <span className="cp-card-type-label">{capsuleTokens.triggerLabels[capsule.triggerType]}</span>
      </div>
      <div className="cp-capsule-center">
        <CapsuleIcon variant="open" />
      </div>
      <h3 className="cp-card-title">{capsule.title}</h3>
      <blockquote className="cp-message-preview">{preview}</blockquote>
      <footer className="cp-card-footer">
        <span>{triggerDescription(capsule)}</span>
        {capsule.openedAt && <time className="cp-opened-at">Aberta em {fmtDate(capsule.openedAt)}</time>}
      </footer>
      <button className="cp-reread-btn" type="button" onClick={onReread}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.51 15a9 9 0 102.13-9.36L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Reler cápsula
      </button>
    </article>
  );
}

export function CapsuleCard({
  capsule, onReveal, onReread,
}: {
  capsule: Capsule;
  onReveal(): void;
  onReread(): void;
}) {
  if (capsule.status === 'DELIVERED') return <DeliveredCard capsule={capsule} onReveal={onReveal} />;
  if (capsule.status === 'OPENED') return <OpenedCard capsule={capsule} onReread={onReread} />;
  return <ScheduledCard capsule={capsule} />;
}

/* ── Empty State ── */

export function CapsuleEmpty({ tab, onCreate }: { tab: string; onCreate(): void }) {
  const content: Record<string, { title: string; desc: string }> = {
    scheduled: { title: 'Nenhuma cápsula agendada', desc: 'Escreva uma mensagem para o seu eu do futuro.' },
    delivered: { title: 'Nenhuma cápsula entregue', desc: 'Quando o momento chegar, suas cápsulas aparecerão aqui.' },
    opened: { title: 'Nenhuma cápsula aberta', desc: 'Cápsulas que você já leu ficam guardadas aqui como memórias.' },
  };
  const { title, desc } = content[tab] ?? { title: '', desc: '' };
  return (
    <div className="cp-empty">
      <div className="cp-empty-capsule">
        <CapsuleIcon variant="sealed" />
      </div>
      <strong>{title}</strong>
      <p>{desc}</p>
      {tab === 'scheduled' && (
        <button className="cp-empty-btn" type="button" onClick={onCreate}>
          + Criar minha primeira cápsula
        </button>
      )}
    </div>
  );
}

/* ── Reveal Dialog ── */

export function RevealDialog({
  capsule, onClose, onOpen, readOnly = false,
}: {
  capsule: Capsule;
  onClose(): void;
  onOpen(): void;
  readOnly?: boolean;
}) {
  const [revealed, setRevealed] = useState(readOnly);

  const capsuleIcon = (
    <div className="cp-reveal-icon" aria-hidden="true">
      <CapsuleIcon variant="arrived" />
    </div>
  );

  if (!revealed) {
    return (
      <MaterialDialog
        open title="Uma cápsula do seu passado chegou"
        description="Você escreveu esta mensagem para o momento em que:"
        icon={capsuleIcon} size="medium" onClose={onClose}
        actions={
          <>
            <button className="md-text-button" onClick={onClose}>Fechar</button>
            <button className="md-filled-button" onClick={() => setRevealed(true)}>Abrir cápsula</button>
          </>
        }
      >
        <div className="cp-reveal-preview">
          <h3 className="cp-reveal-title">{capsule.title}</h3>
          <span className="cp-reveal-trigger-chip">{triggerDescription(capsule)}</span>
        </div>
      </MaterialDialog>
    );
  }

  return (
    <MaterialDialog
      open title={capsule.title} size="medium" onClose={onClose}
      actions={
        <>
          <button className="md-text-button" onClick={onClose}>Fechar</button>
          {!readOnly && (
            <button className="md-filled-button" onClick={() => { onOpen(); onClose(); }}>
              Marcar como lida
            </button>
          )}
        </>
      }
    >
      <div className="cp-reveal-content">
        <p className="cp-reveal-context">{triggerDescription(capsule)}</p>
        {capsule.videoUrl && <VideoPlayer url={capsule.videoUrl} />}
        {capsule.message && <div className="cp-reveal-message">{capsule.message}</div>}
        <p className="cp-reveal-footer">Escrita em {fmtDate(capsule.createdAt)}</p>
      </div>
    </MaterialDialog>
  );
}

/* ── Global Delivery Popup ──
 *
 * Abre automaticamente na cara do usuário assim que uma cápsula é entregue.
 * Não precisa de clique — o dialog surge imediatamente.
 *
 * Fluxo de triggers:
 *  • Por data       → precisa de worker backend (WebSocket/SSE) para disparar
 *                     na hora certa. O frontend apenas escuta e chama push().
 *  • Por conclusão  → disparado pelo frontend no momento da ação do usuário.
 *  • Por meta       → mesmo mecanismo de conclusão; só hora precisa de escuta.
 */

export function CapsuleDeliveryPopup() {
  const { pending, dismiss } = useCapsuleDelivery();
  const autoOpened = useRef<Set<number>>(new Set());
  const [activeId, setActiveId] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  /* Auto-abre fullscreen quando chega uma entrega nova */
  useEffect(() => {
    if (activeId !== null) return;
    const next = pending.find(p => !autoOpened.current.has(p.capsule.id));
    if (next) {
      autoOpened.current.add(next.capsule.id);
      setActiveId(next.capsule.id);
      setRevealed(false);
    }
  }, [pending, activeId]);

  if (pending.length === 0 && activeId === null) return null;

  const target = activeId !== null ? pending.find(p => p.capsule.id === activeId) : null;

  const handleClose = () => { setActiveId(null); setRevealed(false); };
  const handleOpen = () => {
    if (target) { target.onOpen(target.capsule.id); dismiss(target.capsule.id); }
    setActiveId(null); setRevealed(false);
  };

  if (!target) return null;
  const capsule = target.capsule;

  /* ── Fullscreen celebration ── */
  if (!revealed) {
    return (
      <div className="cpd-fullscreen" role="dialog" aria-modal="true">
        {/* Particles */}
        <div className="cpd-particles" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => <span key={i} className="cpd-particle" style={{ '--i': i } as React.CSSProperties} />)}
        </div>

        <div className="cpd-center">
          <div className="cpd-capsule-wrap">
            <CapsuleIcon variant="arrived" />
          </div>
          <span className="cpd-badge">✦ CÁPSULA ENTREGUE</span>
          <h2 className="cpd-title">{capsule.title}</h2>
          <p className="cpd-trigger">{triggerDescription(capsule)}</p>
          <p className="cpd-hint">Você escreveu esta mensagem para este momento.</p>
          <div className="cpd-actions">
            <button className="cpd-btn-open" type="button" onClick={() => setRevealed(true)}>
              Abrir cápsula
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="cpd-btn-later" type="button" onClick={handleClose}>Mais tarde</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Revealed content ── */
  return (
    <div className="cpd-fullscreen cpd-fullscreen--read" role="dialog" aria-modal="true">
      <div className="cpd-read-card">
        <header className="cpd-read-header">
          <div>
            <span className="cpd-read-eyebrow">MENSAGEM DO SEU PASSADO</span>
            <h2>{capsule.title}</h2>
          </div>
          <button className="cpd-read-close" type="button" onClick={handleClose}>×</button>
        </header>
        <div className="cpd-read-body">
          <p className="cpd-read-context">{triggerDescription(capsule)}</p>
          {capsule.videoUrl && isYouTubeUrl(capsule.videoUrl) && (
            <div className="cpd-video-wrap">
              <iframe className="cpd-video" src={toEmbedUrl(capsule.videoUrl)} title="Vídeo da cápsula" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}
          {capsule.message && <div className="cpd-message">{capsule.message}</div>}
          <p className="cpd-written-at">Escrita em {fmtDate(capsule.createdAt)}</p>
        </div>
        <footer className="cpd-read-footer">
          <button className="cpd-btn-later" type="button" onClick={handleClose}>Fechar</button>
          <button className="cpd-btn-open" type="button" onClick={handleOpen}>Marcar como lida</button>
        </footer>
      </div>
    </div>
  );
}

/* ── Create Capsule Dialog ── */

type CreateStep = 'write' | 'trigger' | 'configure';
type CompletionSubtype = 'SUBJECT_COMPLETED' | 'TOPIC_COMPLETED' | 'SUBTOPIC_COMPLETED';
type GoalSubtype = 'STUDY_HOURS_REACHED' | 'QUESTIONS_REACHED' | 'LEVEL_REACHED';

const GOAL_OPTIONS: { type: GoalSubtype; icon: string; label: string; desc: string }[] = [
  { type: 'STUDY_HOURS_REACHED', icon: '◷', label: 'Horas estudadas',    desc: 'Ao atingir X horas' },
  { type: 'QUESTIONS_REACHED',   icon: '✓', label: 'Questões resolvidas', desc: 'Ao resolver X questões' },
  { type: 'LEVEL_REACHED',       icon: '◆', label: 'Nível alcançado',      desc: 'Ao alcançar um nível' },
];

const LEVELS = ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Expert'];

const STEP_TITLES: Record<CreateStep, string> = {
  write: 'Nova cápsula',
  trigger: 'Quando entregar?',
  configure: 'Configurar entrega',
};
const STEP_DESCS: Record<CreateStep, string> = {
  write: 'Escreva uma mensagem para o seu eu do futuro.',
  trigger: 'Escolha quando você vai receber esta cápsula.',
  configure: '',
};

export function CreateCapsuleDialog({
  open, onClose, onCreate, journey,
}: {
  open: boolean;
  onClose(): void;
  onCreate(capsule: Omit<Capsule, 'id' | 'createdAt' | 'status'>): Promise<void>;
  journey: JourneyDetailsResponse | null | undefined;
}) {
  const [step, setStep] = useState<CreateStep>('write');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [category, setCategory] = useState<TriggerCategory | null>(null);

  const [completionType, setCompletionType] = useState<CompletionSubtype>('SUBJECT_COMPLETED');
  const [selectedAreaId, setSelectedAreaId] = useState<number | ''>('');
  const [selectedTopicId, setSelectedTopicId] = useState<number | ''>('');
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<number | ''>('');

  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  const [goalType, setGoalType] = useState<GoalSubtype | null>(null);
  const [numericValue, setNumericValue] = useState('');
  const [levelValue, setLevelValue] = useState('Iniciante');
  const [saving, setSaving] = useState(false);

  const areas = journey?.knowledgeAreas ?? [];
  const selectedArea  = areas.find(a => a.id === selectedAreaId);
  const selectedTopic = selectedArea?.nodes.find(n => n.id === selectedTopicId);

  function reset() {
    setStep('write'); setTitle(''); setMessage(''); setVideoUrl(''); setCategory(null);
    setCompletionType('SUBJECT_COMPLETED');
    setSelectedAreaId(''); setSelectedTopicId(''); setSelectedSubtopicId('');
    setDateValue(''); setTimeValue('');
    setGoalType(null); setNumericValue(''); setLevelValue('Iniciante');
  }

  function handleClose() { reset(); onClose(); }

  function handleChangeCompletionType(type: CompletionSubtype) {
    setCompletionType(type);
    setSelectedTopicId('');
    setSelectedSubtopicId('');
  }

  function handleNext() {
    if (!title.trim()) return void toast.error('Escreva um título para a cápsula.');
    if (!message.trim() && !videoUrl.trim()) return void toast.error('Escreva uma mensagem ou adicione um vídeo.');
    setStep('trigger');
  }

  function handleSelectCategory(cat: TriggerCategory) {
    setCategory(cat);
    setStep('configure');
  }

  async function handleSubmit() {
    const triggerType: TriggerType = (() => {
      if (category === 'date') return 'DATE';
      if (category === 'completion') return completionType;
      return goalType ?? 'STUDY_HOURS_REACHED';
    })();

    if (category === 'date' && !dateValue)
      return void toast.error('Escolha uma data de entrega.');
    if (category === 'completion') {
      if (!selectedAreaId) return void toast.error('Selecione uma matéria.');
      if (completionType !== 'SUBJECT_COMPLETED' && !selectedTopicId)
        return void toast.error('Selecione um tópico.');
      if (completionType === 'SUBTOPIC_COMPLETED' && !selectedSubtopicId)
        return void toast.error('Selecione um subtópico.');
    }
    if (category === 'goal') {
      if (!goalType) return void toast.error('Escolha um tipo de meta.');
      if ((goalType === 'STUDY_HOURS_REACHED' || goalType === 'QUESTIONS_REACHED') && !numericValue)
        return void toast.error('Informe o valor alvo.');
    }

    let refId: number | undefined;
    let refLabel: string | undefined;

    if (category === 'completion') {
      if (completionType === 'SUBJECT_COMPLETED') {
        refId = selectedArea?.id; refLabel = selectedArea?.title;
      } else if (completionType === 'TOPIC_COMPLETED') {
        refId = selectedTopic?.id; refLabel = selectedTopic?.title;
      } else if (completionType === 'SUBTOPIC_COMPLETED') {
        const sub = selectedTopic?.children.find(c => c.id === selectedSubtopicId);
        refId = sub?.id; refLabel = sub?.title;
      }
    } else if (category === 'goal') {
      if (goalType === 'LEVEL_REACHED') refLabel = levelValue;
    }

    const data: Omit<Capsule, 'id' | 'createdAt' | 'status'> = {
      title: title.trim(),
      message: message.trim(),
      ...(videoUrl.trim() && { videoUrl: videoUrl.trim() }),
      triggerType,
      ...(category === 'date' && {
        scheduledAt: dateValue
          ? new Date(`${dateValue}T${timeValue || '08:00'}`).toISOString()
          : undefined,
      }),
      ...(refId !== undefined && { triggerReferenceId: refId }),
      ...(refLabel !== undefined && { triggerReferenceLabel: refLabel }),
      ...((goalType === 'STUDY_HOURS_REACHED' || goalType === 'QUESTIONS_REACHED') && {
        triggerValue: Number(numericValue),
      }),
    };

    setSaving(true);
    try {
      await onCreate(data);
      toast.success('Cápsula criada e selada! ✦');
      handleClose();
    } catch {
      toast.error('Não foi possível criar a cápsula.');
    } finally {
      setSaving(false);
    }
  }

  const configureTitle =
    category === 'date' ? 'Escolher data'
    : category === 'completion' ? 'Selecionar item'
    : 'Escolher meta';

  const dialogTitle = step === 'configure' ? configureTitle : STEP_TITLES[step];
  const dialogDesc  = STEP_DESCS[step] || undefined;

  const actions = (() => {
    if (step === 'write') return (
      <>
        <button className="md-text-button" onClick={handleClose}>Cancelar</button>
        <button className="md-filled-button" onClick={handleNext}>Próximo →</button>
      </>
    );
    if (step === 'trigger') return (
      <>
        <button className="md-text-button" onClick={() => setStep('write')}>← Voltar</button>
        <button className="md-text-button" onClick={handleClose}>Cancelar</button>
      </>
    );
    return (
      <>
        <button className="md-text-button" onClick={() => setStep('trigger')}>← Voltar</button>
        <button className="md-filled-button" disabled={saving} onClick={() => void handleSubmit()}>{saving ? 'Salvando…' : 'Fechar cápsula ✦'}</button>
      </>
    );
  })();

  return (
    <MaterialDialog
      open={open} title={dialogTitle} description={dialogDesc}
      size="medium" scrimClassName="cp-create-scrim" onClose={handleClose} actions={actions}
    >
      {step === 'write' && (
        <div className="cp-create-fields">
          <div className="cp-field">
            <label className="cp-field-label">Título</label>
            <input
              className="cp-field-input" type="text" autoFocus maxLength={100}
              placeholder="Ex: Mensagem para meu eu daqui a um ano"
              value={title} onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="cp-field">
            <label className="cp-field-label">Sua mensagem</label>
            <textarea
              className="cp-field-textarea" rows={5}
              placeholder="Escreva o que quiser dizer para si mesmo neste momento futuro..."
              value={message} onChange={e => setMessage(e.target.value)}
            />
            <span className="cp-char-count">{message.length} caracteres</span>
          </div>
          <div className="cp-field">
            <label className="cp-field-label">
              Link de vídeo <span className="cp-field-optional">(opcional)</span>
            </label>
            <input
              className="cp-field-input" type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
            />
            {videoUrl && (
              <span className="cp-video-hint">
                {isYouTubeUrl(videoUrl) ? '✓ YouTube detectado — player embutido' : '✓ Vídeo será reproduzido na cápsula'}
              </span>
            )}
          </div>
        </div>
      )}

      {step === 'trigger' && (
        <div className="cp-trigger-options">
          <button className="cp-trigger-option" type="button" onClick={() => handleSelectCategory('date')}>
            <span className="cp-trigger-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <div className="cp-trigger-info">
              <strong>Em uma data específica</strong>
              <small>Escolha uma data e horário de entrega</small>
            </div>
            <span className="cp-trigger-arrow" aria-hidden="true">›</span>
          </button>
          <button className="cp-trigger-option" type="button" onClick={() => handleSelectCategory('completion')}>
            <span className="cp-trigger-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <div className="cp-trigger-info">
              <strong>Quando eu concluir algo</strong>
              <small>Matéria, tópico ou subtópico do edital</small>
            </div>
            <span className="cp-trigger-arrow" aria-hidden="true">›</span>
          </button>
          <button className="cp-trigger-option" type="button" onClick={() => handleSelectCategory('goal')}>
            <span className="cp-trigger-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </span>
            <div className="cp-trigger-info">
              <strong>Quando eu atingir uma meta</strong>
              <small>Horas, questões, nível ou meta</small>
            </div>
            <span className="cp-trigger-arrow" aria-hidden="true">›</span>
          </button>
        </div>
      )}

      {step === 'configure' && category === 'date' && (
        <div className="cp-create-fields">
          <div className="cp-date-row">
            <div className="cp-field">
              <label className="cp-field-label">Data</label>
              <input className="cp-field-input" type="date"
                value={dateValue} onChange={e => setDateValue(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="cp-field">
              <label className="cp-field-label">Horário</label>
              <input className="cp-field-input" type="time"
                value={timeValue} onChange={e => setTimeValue(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {step === 'configure' && category === 'completion' && (
        <div className="cp-create-fields">
          <div className="cp-field">
            <label className="cp-field-label">Tipo</label>
            <div className="cp-completion-types">
              {([
                { type: 'SUBJECT_COMPLETED'  as CompletionSubtype, label: 'Matéria' },
                { type: 'TOPIC_COMPLETED'    as CompletionSubtype, label: 'Tópico' },
                { type: 'SUBTOPIC_COMPLETED' as CompletionSubtype, label: 'Subtópico' },
              ]).map(opt => (
                <button key={opt.type} type="button"
                  className={`cp-completion-btn${completionType === opt.type ? ' active' : ''}`}
                  onClick={() => handleChangeCompletionType(opt.type)}
                >{opt.label}</button>
              ))}
            </div>
          </div>
          <div className="cp-field">
            <label className="cp-field-label">Matéria</label>
            {areas.length > 0 ? (
              <select className="cp-field-input" value={selectedAreaId}
                onChange={e => { setSelectedAreaId(Number(e.target.value)); setSelectedTopicId(''); setSelectedSubtopicId(''); }}
              >
                <option value="">Selecione uma matéria</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            ) : (
              <input className="cp-field-input" type="text" placeholder="Ex: Direito Tributário"
                value={typeof selectedAreaId === 'number' ? String(selectedAreaId) : ''}
                onChange={e => setSelectedAreaId(e.target.value as unknown as number)}
              />
            )}
          </div>
          {completionType !== 'SUBJECT_COMPLETED' && selectedAreaId !== '' && (
            <div className="cp-field">
              <label className="cp-field-label">Tópico</label>
              {selectedArea && selectedArea.nodes.length > 0 ? (
                <select className="cp-field-input" value={selectedTopicId}
                  onChange={e => { setSelectedTopicId(Number(e.target.value)); setSelectedSubtopicId(''); }}
                >
                  <option value="">Selecione um tópico</option>
                  {selectedArea.nodes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                </select>
              ) : (
                <p className="cp-field-hint">Esta matéria não possui tópicos cadastrados.</p>
              )}
            </div>
          )}
          {completionType === 'SUBTOPIC_COMPLETED' && selectedTopicId !== '' && (
            <div className="cp-field">
              <label className="cp-field-label">Subtópico</label>
              {selectedTopic && selectedTopic.children.length > 0 ? (
                <select className="cp-field-input" value={selectedSubtopicId}
                  onChange={e => setSelectedSubtopicId(Number(e.target.value))}
                >
                  <option value="">Selecione um subtópico</option>
                  {selectedTopic.children.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              ) : (
                <p className="cp-field-hint">Este tópico não possui subtópicos cadastrados.</p>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'configure' && category === 'goal' && (
        <div className="cp-create-fields">
          <div className="cp-field">
            <label className="cp-field-label">Tipo de meta</label>
            <div className="cp-goal-grid">
              {GOAL_OPTIONS.map(opt => (
                <button key={opt.type} type="button"
                  className={`cp-goal-btn${goalType === opt.type ? ' active' : ''}`}
                  onClick={() => setGoalType(opt.type)}
                >
                  <span>{opt.icon}</span>
                  <strong>{opt.label}</strong>
                  <small>{opt.desc}</small>
                </button>
              ))}
            </div>
          </div>
          {(goalType === 'STUDY_HOURS_REACHED' || goalType === 'QUESTIONS_REACHED') && (
            <div className="cp-field">
              <label className="cp-field-label">
                {goalType === 'STUDY_HOURS_REACHED' ? 'Quantidade de horas' : 'Quantidade de questões'}
              </label>
              <input className="cp-field-input" type="number" min="1"
                placeholder={goalType === 'STUDY_HOURS_REACHED' ? 'Ex: 500' : 'Ex: 1000'}
                value={numericValue} onChange={e => setNumericValue(e.target.value)}
              />
            </div>
          )}
          {goalType === 'LEVEL_REACHED' && (
            <div className="cp-field">
              <label className="cp-field-label">Nível</label>
              <select className="cp-field-input" value={levelValue} onChange={e => setLevelValue(e.target.value)}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
    </MaterialDialog>
  );
}
