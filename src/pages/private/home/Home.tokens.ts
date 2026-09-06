export const homeTokens = {
  route: '/',
  carouselCardWidth: 352,
  carouselGap: 18,
  cardAccents: ['#66558f', '#287c72', '#456b9d', '#9a6331'],
  journeyLevels: ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Expert'],
  metrics: {
    performance: { label: 'Seu desempenho', className: 'metric-performance', icon: '☆' },
    studiedTime: { label: 'Horas estudadas', className: 'metric-hours', icon: '◷' },
    questions: { label: 'Questões resolvidas', className: 'metric-questions', icon: '✓' },
    dailyAverage: { label: 'Média de horas diárias', className: 'metric-average', icon: '⌛' },
  },
  styles: {
    cardAccent: (color: string) => ({ '--card-accent': color } as React.CSSProperties),
    progress: (value: number) => ({ width: `${value}%` } as React.CSSProperties),
  },
} as const;
