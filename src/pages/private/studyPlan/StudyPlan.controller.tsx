import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import { journeyService } from '../../../../@business/service/Journey.service';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { toast } from 'sonner';
import { StudyPlanView } from './StudyPlan.view';
export function StudyPlanController() { const { id } = useParams(); const navigate = useNavigate(); const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null); const [loading, setLoading] = useState(true); useEffect(() => { const journeyId = Number(id); if (!Number.isSafeInteger(journeyId) || journeyId <= 0) { setJourney(null); setLoading(false); return; } let active = true; setLoading(true); journeyService.findById(journeyId).then(data => { if (active) setJourney(data); }).catch(error => { if (active) { setJourney(null); toast.error(getRequestErrorMessage(error, 'Não foi possível carregar o plano de estudos.')); } }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]); return <StudyPlanView journey={journey} loading={loading} onBack={() => navigate('/')} onOverview={() => navigate(`/jornadas/${id}`)} onOpenContent={() => navigate(`/jornadas/${id}/materias`)} onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)} onOpenSimulados={() => navigate(`/jornadas/${id}/simulados`)} onOpenSubject={areaId => navigate(`/jornadas/${id}/materias/${areaId}`)} />; }
