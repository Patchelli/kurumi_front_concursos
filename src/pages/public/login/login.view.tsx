import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../../../components/auth/AuthShell';
import type { LoginViewProps } from './login.type';

export function LoginView(props: LoginViewProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    void props.onSubmit();
  }

  return (
    <AuthShell title={<>Transforme rotina<br />em aprovação.</>} caption="Planeje cada etapa, revise no momento certo e acompanhe sua evolução em um só lugar.">
      <form className="auth-card" onSubmit={submit} noValidate>
        <header>
          <span className="eyebrow">BEM-VINDO DE VOLTA</span>
          <h2>Entre na sua conta</h2>
          <p>Continue exatamente de onde parou.</p>
        </header>
        <label className="field">
          <span>E-mail</span>
          <span className="field-control">
            <span className="leading-icon" aria-hidden="true">@</span>
            <input type="email" autoComplete="email" value={props.email} onChange={event => props.onEmailChange(event.target.value)} placeholder="voce@email.com" autoFocus />
          </span>
        </label>
        <label className="field">
          <span>Senha</span>
          <span className="field-control">
            <span className="leading-icon" aria-hidden="true">●</span>
            <input type={props.showPassword ? 'text' : 'password'} autoComplete="current-password" value={props.password} onChange={event => props.onPasswordChange(event.target.value)} placeholder="Digite sua senha" />
            <button className="icon-button" type="button" onClick={props.onTogglePassword} aria-label={props.showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{props.showPassword ? 'Ocultar' : 'Mostrar'}</button>
          </span>
        </label>
        {props.error && <div className="auth-error" role="alert">{props.error}</div>}
        <button className="filled-button" disabled={props.loading}>{props.loading ? 'Entrando…' : 'Entrar'}</button>
        <p className="auth-switch">Ainda não tem uma conta? <Link to="/cadastro">Criar conta</Link></p>
      </form>
    </AuthShell>
  );
}
