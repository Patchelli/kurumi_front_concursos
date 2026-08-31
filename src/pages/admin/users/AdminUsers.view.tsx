import { ConfirmDialog } from '@components/dialog/ConfirmDialog';
import { UserMenu } from '@components/layout/UserMenu';
import { StudyLoading } from '@components/loading/StudyLoading';
import type { AdminUsersViewProps } from './AdminUsers.type';
import { adminUsersTokens as t } from './AdminUsers.tokens';

export default function AdminUsersView({
  filtered, search, loading, confirmTarget,
  onSearchChange, onRequestToggle, onConfirmToggle, onCancelToggle,
  firstName, onLogout,
}: AdminUsersViewProps) {
  return (
    <div className={t.page}>
      <header className="hub-topbar">
        <a className="hub-brand" href="/inicio" aria-label="Kurumí"><span className="hub-logo">K</span><span>Kurumí</span></a>
        <span className={t.badge}>Admin</span>
        <nav className="hub-nav" aria-label="Navegação admin">
          <a className="active" href="/admin/usuarios">Usuários</a>
        </nav>
        <UserMenu firstName={firstName} onLogout={onLogout} />
      </header>

      <div className={t.content}>
        <header className={t.header}>
          <div>
            <span className={t.eyebrow}>ADMINISTRAÇÃO</span>
            <h1 className={t.heading}>Usuários</h1>
            <p className={t.subtitle}>Gerencie e monitore os usuários da plataforma.</p>
          </div>
        </header>

        {loading ? (
          <StudyLoading variant="section" label="Carregando usuários…" />
        ) : (
          <section className={t.section}>
            <div className={t.toolbar}>
              <div className={t.searchWrap}>
                <svg className={t.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  className={t.search}
                  placeholder="Buscar por nome ou e-mail…"
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                />
              </div>
              <span className={t.count}>{filtered.length} usuário{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {filtered.length === 0 ? (
              <div className={t.empty}>
                <span className={t.emptyIcon}>□</span>
                <b className={t.emptyTitle}>{search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</b>
                <p className={t.emptyText}>{search ? 'Tente outro termo de busca.' : 'Os usuários aparecerão aqui após o cadastro.'}</p>
              </div>
            ) : (
              <div className={t.tableWrap}>
                <table className={t.table}>
                  <thead>
                    <tr className={t.tableHeadRow}>
                      <th className={t.th}>Nome</th><th className={t.th}>E-mail</th><th className={t.th}>Status</th><th className={t.th}>Perfis</th><th className={t.th}>Cadastro</th><th className={t.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(user => {
                      const isActive = user.status === 1;
                      return (
                        <tr key={user.userId} className={`${t.row} ${isActive ? '' : t.inactiveRow}`}>
                          <td className={`${t.td} ${t.name}`}>{user.name || <em className={t.noName}>Sem nome</em>}</td>
                          <td className={`${t.td} ${t.email}`}>{user.email}</td>
                          <td className={t.td}>
                            <span className={`${t.status} ${isActive ? t.statusActive : t.statusInactive}`}>
                              {isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className={`${t.td} ${t.roles}`}>
                            {user.roles.length > 0 ? user.roles.map(r => (
                              <span key={r} className={t.role}>{r}</span>
                            )) : <span className={t.role}>Aluno</span>}
                          </td>
                          <td className={`${t.td} ${t.date}`}>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className={`${t.td} ${t.action}`}>
                            <button
                              className={`${t.actionButton} ${isActive ? t.dangerButton : t.primaryButton}`}
                              onClick={() => onRequestToggle(user)}
                            >
                              {isActive ? 'Desativar' : 'Reativar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.status === 1 ? 'Desativar usuário?' : 'Reativar usuário?'}
        description={
          confirmTarget?.status === 1
            ? `"${confirmTarget?.name || confirmTarget?.email}" perderá acesso à plataforma.`
            : `"${confirmTarget?.name || confirmTarget?.email}" terá acesso restabelecido.`
        }
        confirmLabel={confirmTarget?.status === 1 ? 'Desativar' : 'Reativar'}
        danger={confirmTarget?.status === 1}
        onClose={onCancelToggle}
        onConfirm={onConfirmToggle}
      />
    </div>
  );
}
