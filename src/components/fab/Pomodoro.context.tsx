import { createContext, useContext, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { KnowledgeAreaResponse } from '../../../@business/dto/response/journey.response';
import { PomodoroPanel } from '../../pages/private/studyPlan/StudyPlan.widgets';

type OpenOptions = { areas: KnowledgeAreaResponse[]; initialAreaId?: number; initialTopicId?: number; initialSubtopicId?: number; expand?: boolean };
type Session = OpenOptions & { journeyId: number | null };
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
  const open = (options: OpenOptions) => {
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
    />}
  </PomodoroContext.Provider>;
}

export function usePomodoro() { return useContext(PomodoroContext); }
