import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { adminService } from '@business/service/Admin.service';
import { getRequestErrorMessage } from '@utils/getRequestErrorMessage';
import { logoutMethod } from '@utils/logoutMethod';
import type { AdminUser } from './AdminUsers.type';
import AdminUsersView from './AdminUsers.view';

export function AdminUsersController() {
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('kurumi_concursos_user') || '{}') as { name?: string }; } catch { return {}; } }, []);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    adminService.listUsers()
      .then(data => setUsers(data))
      .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível carregar os usuários.')))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  async function handleConfirmToggle() {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null);
    const isActive = target.status === 1;
    try {
      const ok = isActive
        ? await adminService.deactivateUser(target.userId)
        : await adminService.activateUser(target.userId);
      if (!ok) throw new Error();
      setUsers(current => current.map(u => u.userId === target.userId ? { ...u, status: isActive ? 0 : 1 } : u));
      toast.success(`Usuário ${isActive ? 'desativado' : 'reativado'} com sucesso.`);
    } catch (error) {
      toast.error(getRequestErrorMessage(error, `Não foi possível ${isActive ? 'desativar' : 'reativar'} o usuário.`));
    }
  }

  const firstName = user.name?.trim().split(' ')[0] || 'Admin';
  return <AdminUsersView
    users={users}
    filtered={filtered}
    search={search}
    loading={loading}
    confirmTarget={confirmTarget}
    onSearchChange={setSearch}
    onRequestToggle={setConfirmTarget}
    onConfirmToggle={handleConfirmToggle}
    onCancelToggle={() => setConfirmTarget(null)}
    firstName={firstName}
    onLogout={logoutMethod}
  />;
}
