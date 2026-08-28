import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Home, Journey, StudyPlan, SubjectList, SubjectDetail, Capsule, Calendar, Simulados } from './imports/private.imports';
import { Login, Register } from './imports/public.imports';
import { PrivateRoute } from './security_routes';
import { StudyLoading } from '../components/loading/StudyLoading';

export default function RoutesApp() {
  return <Suspense fallback={<StudyLoading delayMs={0} label="Abrindo sua área de estudos…" />}><Routes>
    <Route path="/entrar" element={<Login />} /><Route path="/cadastro" element={<Register />} />
    <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
    <Route path="/calendario" element={<PrivateRoute><Calendar /></PrivateRoute>} />
    <Route path="/agenda" element={<Navigate to="/calendario" replace />} />
    <Route path="/jornadas/:id" element={<PrivateRoute><Journey /></PrivateRoute>} />
    <Route path="/jornadas/:id/plano" element={<PrivateRoute><StudyPlan /></PrivateRoute>} />
    <Route path="/jornadas/:id/materias" element={<PrivateRoute><SubjectList /></PrivateRoute>} />
    <Route path="/jornadas/:id/materias/:areaId" element={<PrivateRoute><SubjectDetail /></PrivateRoute>} />
    <Route path="/jornadas/:id/capsulas" element={<PrivateRoute><Capsule /></PrivateRoute>} />
    <Route path="/jornadas/:id/simulados" element={<PrivateRoute><Simulados /></PrivateRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
