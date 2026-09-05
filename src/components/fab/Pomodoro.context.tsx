import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { KnowledgeAreaResponse } from '../../../@business/dto/response/journey.response';
import { PomodoroPanel } from '../../pages/private/studyPlan/StudyPlan.widgets';
import { journeyService } from '../../../@business/service/Journey.service';
import { studyTimerFinishedEvent, studyTimerService, type StudyTimerSaveRequest, type StudyTimerState } from '../../../@business/service/StudyTimer.service';
import { authenticationChangedEvent, getAccessToken } from '../../utils/authenticationStorage';
import { toast } from 'sonner';

type OpenOptions = { areas: KnowledgeAreaResponse[]; initialAreaId?: number; initialTopicId?: number; initialSubtopicId?: number; expand?: boolean };
type Session = OpenOptions & { journeyId: number | null; restored?: StudyTimerState };
type PomodoroContextValue = { open(options: OpenOptions): void; running: boolean; activeAreaId?: number; activeTopicId?: number; activeSubtopicId?: number };
const PomodoroContext = createContext<PomodoroContextValue>({ open: () => {}, running: false });

function journeyIdFrom(pathname: string) {
  const value = pathname.match(/^\/jornadas\/(\d+)/)?.[1];
  return value ? Number(value) : null;
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [running, setRunning] = useState(false);
  const [expandSignal, setExpandSignal] = useState(0);
  const currentJourneyId = journeyIdFrom(location.pathname);
  const restore = useCallback(async () => {
    if (!getAccessToken()) {
      setRunning(false);
      setSession(null);
      return;
    }
    try {
      const active = await studyTimerService.active();
      if (!active) return;
      const journey = await journeyService.findById(active.journeyId);
      setSession({ journeyId: active.journeyId, areas: journey.knowledgeAreas,
        initialAreaId: active.knowledgeAreaId,
        initialTopicId: active.syllabusNodeId ? journey.knowledgeAreas.flatMap(a => a.nodes).find(n => n.id === active.syllabusNodeId || n.children.some(c => c.id === active.syllabusNodeId))?.id : undefined,
        initialSubtopicId: journey.knowledgeAreas.flatMap(a => a.nodes).flatMap(n => n.children).some(c => c.id === active.syllabusNodeId) ? active.syllabusNodeId ?? undefined : undefined,
        restored: active });
    } catch { /* Authentication and global error handling already own request failures. */ }
  }, []);
  useEffect(() => {
    void restore();
    window.addEventListener(authenticationChangedEvent, restore);
    return () => window.removeEventListener(authenticationChangedEvent, restore);
  }, [restore]);
  const open = (options: OpenOptions) => {
    if (session?.restored && session.restored.accumulatedFocusSeconds > 0) {
      const requestedNode = options.initialSubtopicId ?? options.initialTopicId ?? null;
      if (session.restored.knowledgeAreaId !== options.initialAreaId || session.restored.syllabusNodeId !== requestedNode) {
        toast.info('Finalize ou descarte a sessão atual antes de trocar o conteúdo.');
        setExpandSignal(value => value + 1);
        return;
      }
    }
    // Starting a study context must not unexpectedly restore a minimized timer.
    // The FAB explicitly requests expansion; topic/subtopic actions only change the context.
    setSession({ ...options, journeyId: currentJourneyId });
    if (!session || options.expand) setExpandSignal(value => value + 1);
  };
  return <PomodoroContext.Provider value={{ open, running, activeAreaId: session?.initialAreaId, activeTopicId: session?.initialTopicId, activeSubtopicId: session?.initialSubtopicId }}>
    {children}
    {session && <PomodoroPanel
      open={session.journeyId !== null && session.journeyId === currentJourneyId}
      onClose={() => { setRunning(false); setSession(null); }}
      onRunningChange={setRunning}
      expandSignal={expandSignal}
      areas={session.areas}
      initialAreaId={session.initialAreaId}
      initialTopicId={session.initialTopicId}
      initialSubtopicId={session.initialSubtopicId}
      restored={session.restored}
      journeyId={session.journeyId!}
      onSave={async (request: StudyTimerSaveRequest) => {
        const saved = await studyTimerService.save(request);
        setSession(current => current ? { ...current, restored: saved } : current);
        return saved;
      }}
      onFinish={async completed => { await studyTimerService.finish(completed); window.dispatchEvent(new CustomEvent(studyTimerFinishedEvent, { detail: { journeyId: session.journeyId } })); setRunning(false); setSession(null); toast.success('Tempo de estudo registrado.'); }}
      onDiscard={async () => { await studyTimerService.discard(); setRunning(false); setSession(null); }}
    />}
  </PomodoroContext.Provider>;
}

export function usePomodoro() { return useContext(PomodoroContext); }
