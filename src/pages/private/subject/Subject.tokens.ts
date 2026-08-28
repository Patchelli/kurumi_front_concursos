export const subjectTokens = {
  routes: {
    list: (id: number) => `/jornadas/${id}/materias`,
    detail: (id: number, areaId: number) => `/jornadas/${id}/materias/${areaId}`,
  },
} as const;
