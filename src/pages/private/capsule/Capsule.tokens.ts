import type { TriggerType } from './Capsule.type';

export const capsuleTokens = {
  triggerLabels: {
    DATE: 'Em uma data',
    SUBJECT_COMPLETED: 'Matéria concluída',
    TOPIC_COMPLETED: 'Tópico concluído',
    SUBTOPIC_COMPLETED: 'Subtópico concluído',
    STUDY_HOURS_REACHED: 'Horas de estudo',
    QUESTIONS_REACHED: 'Questões resolvidas',
    LEVEL_REACHED: 'Nível alcançado',
  } as Record<TriggerType, string>,
} as const;
