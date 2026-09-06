import type { CSSProperties } from 'react';

export const journeyTokens = {
  route: '/jornadas/:id',
  colors: { primary: '#66558f', success: '#22907a', warning: '#c87030', danger: '#b03055', muted: '#c8c0d0' },
  weekDays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  styles: {
    today: { textTransform: 'capitalize', fontWeight: 600 } as CSSProperties,
    inlineDot: { display: 'inline-block' } as CSSProperties,
    legendTime: { background: '#66558f' } as CSSProperties,
    legendPerformance: { background: '#22907a' } as CSSProperties,
    spacedInsights: { marginTop: 10 } as CSSProperties,
    subjectHeader: { padding: '0 0 12px', border: 'none', marginBottom: 4 } as CSSProperties,
    subjectTitle: { fontSize: 14, fontWeight: 800, margin: 0, color: '#1e1829' } as CSSProperties,
    subjectSubtitle: { fontSize: 11, color: '#9080a8' } as CSSProperties,
    effortList: { maxHeight: 280 } as CSSProperties,
    emptyTopics: { padding: '10px 0' } as CSSProperties,
    width: (value: number): CSSProperties => ({ width: `${value}%` }),
    height: (value: number): CSSProperties => ({ height: `${value}%` }),
    color: (value: string): CSSProperties => ({ color: value }),
    colorStrong: (value: string): CSSProperties => ({ color: value, fontWeight: 800 }),
    widthColor: (value: number, color: string): CSSProperties => ({ width: `${value}%`, background: color }),
    heightColor: (value: number, color: string): CSSProperties => ({ height: `${value}%`, background: color }),
    weekBar: (value: number, visible: boolean): CSSProperties => ({ height: `${value}%`, opacity: visible ? 1 : .25 }),
  },
} as const;
