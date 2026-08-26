export const homeTokens = {
  route: '/',
  carouselCardWidth: 352,
  carouselGap: 18,
  cardAccents: ['#66558f', '#287c72', '#456b9d', '#9a6331'],
  styles: {
    cardAccent: (color: string) => ({ '--card-accent': color } as React.CSSProperties),
    progress: (value: number) => ({ width: `${value}%` } as React.CSSProperties),
  },
} as const;
