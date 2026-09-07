export function isStudyCompleted(progress: number | string | null | undefined): boolean {
  if (typeof progress === 'string') return progress.toLowerCase() === 'studied' || progress === '3';
  return progress === 3 || (progress ?? 0) >= 100;
}

export function isStudyPending(progress: number | string | null | undefined): boolean {
  if (isStudyCompleted(progress)) return false;
  if (typeof progress === 'string') return progress.toLowerCase() === 'inprogress' || progress === '2';
  return progress === 2;
}

export function studyProgressLabel(progress: number | string | null | undefined): string {
  if (isStudyCompleted(progress)) return 'Concluído';
  if (isStudyPending(progress)) return 'Pendente';
  return 'Não iniciado';
}

export function studyProgressPercent(progress: number | string | null | undefined): number {
  if (isStudyCompleted(progress)) return 100;
  if (typeof progress === 'string') return progress.toLowerCase() === 'inprogress' || progress === '2' ? 50 : 0;
  if (progress === 2) return 50;
  if (progress === 1) return 0;
  return Math.max(0, Math.min(100, progress ?? 0));
}
