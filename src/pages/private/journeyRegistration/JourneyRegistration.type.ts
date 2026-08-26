import type { EJourneyStage } from '../../../../@business/enum/EJourneyStage';

export type JourneyIntent = 'future' | 'completed';
export type SyllabusMode = 'blank' | 'manual' | 'json';
export type SyllabusNodeDraft = { title: string; children: SyllabusNodeDraft[] };
export type SyllabusAreaDraft = { title: string; topics: SyllabusNodeDraft[] };
export type JourneyRegistrationForm = {
  intent?: JourneyIntent;
  title: string;
  institution: string;
  examBoard: string;
  position: string;
  openings: string;
  stage: EJourneyStage;
  examDate: string;
  syllabusMode: SyllabusMode;
  areas: SyllabusAreaDraft[];
  includeInStatistics: boolean;
};

export type JourneyRegistrationViewProps = {
  step: number;
  form: JourneyRegistrationForm;
  areaDraft: string;
  jsonDraft: string;
  saving: boolean;
  error: string;
  onBack(): void;
  onPrevious(): void;
  onNext(): void;
  onSubmit(): void;
  onFieldChange(field: keyof JourneyRegistrationForm, value: JourneyRegistrationForm[keyof JourneyRegistrationForm]): void;
  onAreaDraftChange(value: string): void;
  onJsonDraftChange(value: string): void;
  onImportJson(value?: unknown): void;
  onAddArea(): void;
  onRemoveArea(index: number): void;
  onAddTopic(areaIndex: number): void;
};
