import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Home, Journey } from './imports/private.imports';
import { Login, Register } from './imports/public.imports';
import { PrivateRoute } from './security_routes';

export default function RoutesApp() {
  return <Suspense fallback={<div className="route-loading" aria-label="Carregando" />}><Routes><Route path="/entrar" element={<Login />} /><Route path="/cadastro" element={<Register />} /><Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} /><Route path="/jornadas/:id" element={<PrivateRoute><Journey /></PrivateRoute>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense>;
}
