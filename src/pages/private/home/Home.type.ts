import type { JourneySummaryResponse } from '../../../../@business/dto/response/journey.response';
import type { EJourneyStage } from '../../../../@business/enum/EJourneyStage';
import type { SaveJourneyStructureRequest } from '../../../../@business/dto/request/journey.request';

export type JourneyForm = {
  title: string;
  institution: string;
  examBoard: string;
  position: string;
  examDate: string;
  stage: EJourneyStage;
};

export type HomeViewProps = {
  firstName: string;
  journeys: JourneySummaryResponse[];
  visibleJourneys: JourneySummaryResponse[];
  query: string;
  loading: boolean;
  saving: boolean;
  error: string;
  creationOpen: boolean;
  editingContest: JourneySummaryResponse | null;
  removingContest: JourneySummaryResponse | null;
  form: JourneyForm;
  carouselRef: React.RefObject<HTMLDivElement | null>;
  onQueryChange(value: string): void;
  onOpenCreation(): void;
  onCloseCreation(): void;
  onFormChange(field: keyof JourneyForm, value: string | EJourneyStage): void;
  onCreate(request: SaveJourneyStructureRequest): Promise<void>;
  onRemove(id: string): void;
  onRequestRemove(contest: JourneySummaryResponse): void;
  onCancelRemove(): void;
  onRequestEdit(contest: JourneySummaryResponse): void;
  onCancelEdit(): void;
  onSaveEdit(request: SaveJourneyStructureRequest): Promise<void>;
  onOpenJourney(id: string): void;
  onScroll(direction: number): void;
  onPointerDown(event: React.PointerEvent<HTMLDivElement>): void;
  onPointerMove(event: React.PointerEvent<HTMLDivElement>): void;
  onPointerUp(): void;
  onLogout(): void;
};
