import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JourneyRegisterRequest, JourneyUpdateRequest } from '../../../../@business/dto/request/journey.request';
import type { JourneySummaryResponse } from '../../../../@business/dto/response/journey.response';
import { EJourneyStage } from '../../../../@business/enum/EJourneyStage';
import { journeyService } from '../../../../@business/service/Journey.service';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { logoutMethod } from '../../../utils/logoutMethod';
import { HomeView } from './Home.view';
import type { JourneyForm } from './Home.type';

const emptyForm: JourneyForm = { title: '', institution: '', examBoard: '', position: '', examDate: '', stage: EJourneyStage.PreNotice };

export function HomeController() {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const [journeys, setJourneys] = useState<JourneySummaryResponse[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creationOpen, setCreationOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<JourneySummaryResponse | null>(null);
  const [removingContest, setRemovingContest] = useState<JourneySummaryResponse | null>(null);
  const [form, setForm] = useState<JourneyForm>(emptyForm);
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('kurumi_concursos_user') ?? '{}') as { name?: string }; } catch { return {}; } }, []);
  const visibleJourneys = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    return term ? journeys.filter(item => [item.title, item.institution, item.position].some(value => value?.toLocaleLowerCase('pt-BR').includes(term))) : journeys;
  }, [journeys, query]);

  useEffect(() => {
    let active = true;
    journeyService.findAll().then(data => { if (active) setJourneys(data); })
      .catch(requestError => { if (active) setError(getRequestErrorMessage(requestError, 'Não foi possível carregar seus concursos.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function createContest(request: JourneyRegisterRequest) {
    setError('');
    const created = await journeyService.register(request);
    navigate(`/jornadas/${created.id}`);
    return created.id;
  }

  async function updateContest(request: JourneyUpdateRequest) {
    setError('');
    if (!editingContest || request.id !== editingContest.id) throw new Error('Não foi possível identificar a jornada que será editada.');
    const updated = await journeyService.update(request);
    if (!updated) throw new Error('Não foi possível atualizar o concurso.');
    setJourneys(await journeyService.findAll());
    setEditingContest(null);
  }

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const node = carouselRef.current;
    if (!node || (event.target as HTMLElement).closest('button,a')) return;
    drag.current = { active: true, moved: false, startX: event.clientX, scrollLeft: node.scrollLeft };
  }
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const node = carouselRef.current;
    if (node && drag.current.active) {
      const distance = event.clientX - drag.current.startX;
      if (Math.abs(distance) > 6) {
        drag.current.moved = true;
        if (!node.hasPointerCapture(event.pointerId)) node.setPointerCapture(event.pointerId);
      }
      node.scrollLeft = drag.current.scrollLeft - distance * 1.15;
    }
  }
  async function removeContest(id: number) {
    setError('');
    try {
      await journeyService.remove(id);
      setJourneys(current => current.filter(item => item.id !== id));
      setRemovingContest(null);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Não foi possível remover o concurso.'));
    }
  }

  return <HomeView
    firstName={user.name?.trim().split(' ')[0] || 'estudante'} journeys={journeys} visibleJourneys={visibleJourneys}
    query={query} loading={loading} saving={false} error={error} creationOpen={creationOpen}
    editingContest={editingContest} removingContest={removingContest} form={form} carouselRef={carouselRef}
    onQueryChange={setQuery} onOpenCreation={() => setCreationOpen(true)} onCloseCreation={() => setCreationOpen(false)}
    onFormChange={(field, value) => setForm(current => ({ ...current, [field]: value }))} onCreate={createContest}
    onRemove={removeContest} onRequestRemove={setRemovingContest} onCancelRemove={() => setRemovingContest(null)}
    onRequestEdit={setEditingContest} onCancelEdit={() => setEditingContest(null)}
    onSaveEdit={updateContest}
    onOpenJourney={id => { if (!drag.current.moved) navigate(`/jornadas/${id}`); }}
    onScroll={direction => carouselRef.current?.scrollBy({ left: direction * 370, behavior: 'smooth' })}
    onPointerDown={pointerDown} onPointerMove={pointerMove}
    onPointerUp={() => { drag.current.active = false; setTimeout(() => { drag.current.moved = false; }, 0); }}
    onLogout={logoutMethod}
  />;
}
