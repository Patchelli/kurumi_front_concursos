import { useState } from 'react';
import { FlashcardCreator } from './FlashcardCreator';
import type { KnowledgeAreaResponse } from '../../../@business/dto/response/journey.response';
import { usePomodoro } from './Pomodoro.context';

export function ContestFAB({ areas = [] }: { areas?: KnowledgeAreaResponse[] }) {
  const [flashcardOpen, setFlashcardOpen] = useState(false);
  const pomodoro = usePomodoro();

  return (
    <>
    <div className="jd-floating-actions" aria-label="Ações rápidas">
      <button className="jd-fab-action flashcard" type="button" title="Flashcard" aria-label="Flashcard" onClick={() => setFlashcardOpen(true)}>
        <span className="flashcard-stack-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="5" y="4" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M8 2h9a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M9 9h5M9 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </span>
      </button>
      <button data-pomodoro-trigger className="jd-fab-action pomodoro" type="button" title="Pomodoro" aria-label="Pomodoro" onClick={() => pomodoro.open({ areas, expand: true })}>
        <span aria-hidden="true">◷</span>
      </button>
    </div>
    <FlashcardCreator open={flashcardOpen} onClose={() => setFlashcardOpen(false)} areas={areas} />
    </>
  );
}
