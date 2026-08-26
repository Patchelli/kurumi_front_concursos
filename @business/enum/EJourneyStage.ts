export enum EJourneyStage {
  PreNotice = 1,
  PostNotice = 2,
  Completed = 3,
  Archived = 4,
}

export const journeyStageLabel: Record<EJourneyStage, string> = {
  [EJourneyStage.PreNotice]: 'Pré-edital',
  [EJourneyStage.PostNotice]: 'Pós-edital',
  [EJourneyStage.Completed]: 'Concluído',
  [EJourneyStage.Archived]: 'Arquivado',
};
