import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';

export type TriggerType =
  | 'DATE'
  | 'SUBJECT_COMPLETED'
  | 'TOPIC_COMPLETED'
  | 'SUBTOPIC_COMPLETED'
  | 'STUDY_HOURS_REACHED'
  | 'QUESTIONS_REACHED'
  | 'LEVEL_REACHED';

export type CapsuleStatus = 'SCHEDULED' | 'DELIVERED' | 'OPENED';
export type TriggerCategory = 'date' | 'completion' | 'goal';

export interface Capsule {
  id: number;
  title: string;
  message: string;
  /** URL de vídeo opcional (YouTube ou direto). */
  videoUrl?: string;
  status: CapsuleStatus;
  triggerType: TriggerType;
  /** ID da entidade referenciada (área, tópico, subtópico). */
  triggerReferenceId?: number;
  /** Nome legível da entidade referenciada. */
  triggerReferenceLabel?: string;
  /** Valor numérico alvo (horas, questões, nível…). */
  triggerValue?: number;
  /** ISO string da data agendada (apenas triggerType DATE). */
  scheduledAt?: string;
  createdAt: string;
  deliveredAt?: string;
  openedAt?: string;
}

export type CapsuleViewProps = {
  capsules: Capsule[];
  journey: JourneyDetailsResponse | null;
  loading: boolean;
  onBack(): void;
  onOverview(): void;
  onOpenStudyPlan(): void;
  onOpenContent(): void;
  onOpenSimulados(): void;
  onCreate(capsule: Omit<Capsule, 'id' | 'createdAt' | 'status'>): Promise<void>;
  onOpen(id: number): Promise<void>;
  onDelete(id: number): Promise<void>;
};
