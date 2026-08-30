import { Link } from 'react-router-dom';
import { UserMenu } from '@components/layout/UserMenu';
import type { ProfileViewProps } from './Profile.type';

export function ProfileView(props: ProfileViewProps) {
  return (
    <div className="journey-hub">
      <header className="hub-topbar">
        <Link className="hub-brand" to="/" aria-label="Kurumí"><span className="hub-logo">K</span><span>Kurumí</span></Link>
        <nav className="hub-nav" aria-label="Navegação principal">
          <a href="/">Jornadas</a>
          <a href="/calendario">Calendário</a>
          <button type="button" disabled>Desempenho</button>
        </nav>
        <UserMenu firstName={props.firstName} onLogout={props.onLogout} />
      </header>

      <main className="profile-page">
        <div className="profile-container">
          <header className="profile-header">
            <div className="profile-avatar-lg">{props.firstName.charAt(0).toUpperCase()}</div>
            <div>
              <span className="eyebrow">CONTA</span>
              <h1>Meu perfil</h1>
              <p className="muted">{props.email}</p>
            </div>
          </header>

          <form className="profile-form" onSubmit={event => { event.preventDefault(); props.onSubmit(); }}>
            <section className="profile-section">
              <h2>Informações pessoais</h2>
              <label className="profile-field">
                <span>Nome</span>
                <input type="text" value={props.form.name} onChange={event => props.onFormChange('name', event.target.value)} placeholder="Seu nome completo" autoComplete="name" disabled={props.loadingProfile} />
              </label>
              <label className="profile-field">
                <span>E-mail</span>
                <input type="email" value={props.email} disabled title="O e-mail não pode ser alterado" />
              </label>
              <label className="profile-field">
                <span>Documento</span>
                <input type="text" value={props.form.document} onChange={event => props.onFormChange('document', event.target.value)} placeholder="CPF ou outro documento" disabled={props.loadingProfile} />
              </label>
              <label className="profile-field">
                <span>Telefone</span>
                <input type="tel" value={props.form.phone} onChange={event => props.onFormChange('phone', event.target.value)} placeholder="Seu telefone" autoComplete="tel" disabled={props.loadingProfile} />
              </label>
            </section>

            <section className="profile-section">
              <h2>Alterar senha <small>opcional</small></h2>
              <label className="profile-field">
                <span>Senha atual</span>
                <input type="password" value={props.form.currentPassword} onChange={event => props.onFormChange('currentPassword', event.target.value)} placeholder="••••••••" autoComplete="current-password" disabled={props.loadingProfile} />
              </label>
              <div className="profile-field-row">
                <label className="profile-field">
                  <span>Nova senha</span>
                  <input type="password" value={props.form.newPassword} onChange={event => props.onFormChange('newPassword', event.target.value)} placeholder="Mín. 8 caracteres" autoComplete="new-password" disabled={props.loadingProfile} />
                </label>
                <label className="profile-field">
                  <span>Confirmar nova senha</span>
                  <input type="password" value={props.form.confirmPassword} onChange={event => props.onFormChange('confirmPassword', event.target.value)} placeholder="••••••••" autoComplete="new-password" disabled={props.loadingProfile} />
                </label>
              </div>
            </section>

            {props.error && <div className="hub-error" role="alert">{props.error}</div>}
            {props.success && <div className="profile-success" role="status">{props.success}</div>}

            <div className="profile-actions">
              <button type="submit" className="filled-button" disabled={props.loading || props.loadingProfile}>
                {props.loading ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
