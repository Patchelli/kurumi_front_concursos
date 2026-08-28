import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import { journeyService } from '../../../../@business/service/Journey.service';
import { ConfirmDialog } from '../../../components/dialog/ConfirmDialog';
import { InputDialog } from '../../../components/dialog/InputDialog';
import { JourneyView } from './Journey.view';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';

type InputState = { title: string; description?: string; placeholder: string; maxLength: number; onConfirm(value: string): void };
type ConfirmState = { title: string; description: string; onConfirm(): void };

export function JourneyController() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputDialog, setInputDialog] = useState<InputState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState | null>(null);

  const journeyId = Number(id);
  const validJourneyId = Number.isSafeInteger(journeyId) && journeyId > 0;
  const load = async () => { if (!validJourneyId) return; setJourney(await journeyService.findById(journeyId)); };
  useEffect(() => {
    if (!validJourneyId) { setJourney(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    journeyService.findById(journeyId)
      .then(data => { if (active) setJourney(data); })
      .catch(error => { if (active) { setJourney(null); toast.error(getRequestErrorMessage(error, 'Não foi possível carregar o concurso.')); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [journeyId, validJourneyId]);

  const mutate = async (operation: () => Promise<unknown>, successMsg?: string) => {
    try { await operation(); await load(); if (successMsg) toast.success(successMsg); }
    catch (error) { toast.error(getRequestErrorMessage(error, 'Não foi possível concluir a operação.')); }
  };

  return (
    <>
      <JourneyView
        journey={journey}
        loading={loading}
        onBack={() => navigate('/')}
        onOpenStudyPlan={() => navigate(`/jornadas/${id}/plano`)}
        onAddArea={() => setInputDialog({
          title: 'Nova matéria',
          description: 'Adicione uma disciplina ao edital deste concurso.',
          placeholder: 'Ex: Direito Constitucional, Português…',
          maxLength: 180,
          onConfirm: title => { if (id) void mutate(() => journeyService.addArea({ id: null, journeyId: Number(id), title, order: journey?.knowledgeAreas.length ?? 0, weight: null, expectedQuestions: null }), 'Matéria adicionada com sucesso!'); },
        })}
        onRemoveArea={areaId => {
          const area = journey?.knowledgeAreas.find(a => a.id === areaId);
          setConfirmDialog({
            title: 'Remover matéria?',
            description: `"${area?.title ?? 'Esta matéria'}" e todos os seus tópicos serão removidos permanentemente.`,
            onConfirm: () => void mutate(() => journeyService.removeArea(areaId), 'Matéria removida.'),
          });
        }}
        onAddTopic={(areaId, order) => setInputDialog({
          title: 'Novo tópico',
          description: 'Adicione um tópico dentro desta matéria.',
          placeholder: 'Ex: Interpretação de texto, Funções…',
          maxLength: 300,
          onConfirm: title => void mutate(() => journeyService.addNode({ id: null, knowledgeAreaId: areaId, parentId: null, title, order }), 'Tópico adicionado com sucesso!'),
        })}
        onAddSubtopic={(areaId, parentId, order) => setInputDialog({
          title: 'Novo subtópico',
          description: 'Detalhe um conteúdo específico dentro do tópico.',
          placeholder: 'Ex: Coesão e coerência, Derivação…',
          maxLength: 300,
          onConfirm: title => void mutate(() => journeyService.addNode({ id: null, knowledgeAreaId: areaId, parentId, title, order }), 'Subtópico adicionado com sucesso!'),
        })}
        onRemoveNode={nodeId => {
          const node = journey?.knowledgeAreas.flatMap(a => [...a.nodes, ...a.nodes.flatMap(n => n.children)]).find(n => n.id === nodeId);
          setConfirmDialog({
            title: 'Remover tópico?',
            description: `"${node?.title ?? 'Este tópico'}" será removido permanentemente.`,
            onConfirm: () => void mutate(() => journeyService.removeNode(nodeId), 'Tópico removido.'),
          });
        }}
        onCreateFlashcard={() => toast.info('A criação de flashcards ainda será conectada ao backend.')}
        onOpenPomodoro={() => toast.info('O temporizador Pomodoro ainda será implementado.')}
        onOpenContent={() => navigate(`/jornadas/${id}/materias`)}
        onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)}
        onOpenSimulados={() => navigate(`/jornadas/${id}/simulados`)}
      />
      <InputDialog
        open={Boolean(inputDialog)}
        title={inputDialog?.title ?? ''}
        description={inputDialog?.description}
        placeholder={inputDialog?.placeholder}
        maxLength={inputDialog?.maxLength}
        onConfirm={v => inputDialog?.onConfirm(v)}
        onClose={() => setInputDialog(null)}
      />
      <ConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ''}
        description={confirmDialog?.description ?? ''}
        confirmLabel="Remover"
        danger
        onConfirm={() => { confirmDialog?.onConfirm(); setConfirmDialog(null); }}
        onClose={() => setConfirmDialog(null)}
      />
    </>
  );
}
