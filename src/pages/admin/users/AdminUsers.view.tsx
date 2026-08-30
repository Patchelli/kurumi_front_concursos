import { ConfirmDialog } from '@components/dialog/ConfirmDialog';
import { UserMenu } from '@components/layout/UserMenu';
import { StudyLoading } from '@components/loading/StudyLoading';
import type { AdminUsersViewProps } from './AdminUsers.type';

export default function AdminUsersView({
  filtered, search, loading, confirmTarget,
  onSearchChange, onRequestToggle, onConfirmToggle, onCancelToggle,
  firstName, onLogout,
}: AdminUsersViewProps) {
  return (
    <div className="adm-page">
      <header className="hub-topbar">
        <a className="hub-brand" href="/" aria-label="Kurumí"><span className="hub-logo">K</span><span>Kurumí</span></a>
        <span className="adm-badge">Admin</span>
        <nav className="hub-nav" aria-label="Navegação admin">
          <a className="active" href="/admin/usuarios">Usuários</a>
        </nav>
        <UserMenu firstName={firstName} onLogout={onLogout} />
      </header>

      <div className="adm-content">
        <header className="adm-header">
          <div>
            <span className="agenda-eyebrow">ADMINISTRAÇÃO</span>
            <h1>Usuários</h1>
            <p>Gerencie e monitore os usuários da plataforma.</p>
          </div>
        </header>

        {loading ? (
          <StudyLoading variant="section" label="Carregando usuários…" />
        ) : (
          <section className="adm-section">
            <div className="adm-toolbar">
              <div className="adm-search-wrap">
                <svg className="adm-search-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  className="adm-search"
                  placeholder="Buscar por nome ou e-mail…"
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                />
              </div>
              <span className="adm-count">{filtered.length} usuário{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="adm-empty">
                <span>□</span>
                <b>{search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</b>
                <p>{search ? 'Tente outro termo de busca.' : 'Os usuários aparecerão aqui após o cadastro.'}</p>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Status</th>
                      <th>Perfis</th>
                      <th>Cadastro</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(user => {
                      const isActive = user.status === 1;
                      return (
                        <tr key={user.userId} className={isActive ? '' : 'adm-row--inactive'}>
                          <td className="adm-cell-name">{user.name || <em className="adm-no-name">Sem nome</em>}</td>
                          <td className="adm-cell-email">{user.email}</td>
                          <td>
                            <span className={`adm-status ${isActive ? 'adm-status--active' : 'adm-status--inactive'}`}>
                              {isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="adm-cell-roles">
                            {user.roles.length > 0 ? user.roles.map(r => (
                              <span key={r} className="adm-role-tag">{r}</span>
                            )) : <span className="adm-role-tag">Aluno</span>}
                          </td>
                          <td className="adm-cell-date">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="adm-cell-action">
                            <button
                              className={`adm-action-btn ${isActive ? 'adm-action-btn--danger' : 'adm-action-btn--primary'}`}
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
