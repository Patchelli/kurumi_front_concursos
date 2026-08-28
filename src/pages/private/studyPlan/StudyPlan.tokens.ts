import type { CSSProperties } from 'react';
export const studyPlanTokens = {
  route: '/jornadas/:id/plano', weekdays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  blockTypes: ['Teoria', 'Questões', 'Revisão'] as const, durations: [45, 30, 20],
  styles: { progress: (value: number): CSSProperties => ({ width: `${Math.min(100, Math.max(0, value))}%` }) },
} as const;
