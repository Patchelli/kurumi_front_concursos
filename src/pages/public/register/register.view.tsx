import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../../../components/auth/AuthShell';
import type { RegisterViewProps } from './register.type';

export function RegisterView(props: RegisterViewProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    void props.onSubmit();
  }

  return (
    <AuthShell title={<>Sua preparação<br />começa agora.</>} caption="Crie sua conta e organize jornadas, matérias, revisões e simulados com clareza.">
      <form className="auth-card register-card" onSubmit={submit} noValidate>
        <header>
          <span className="eyebrow">COMECE AGORA</span>
          <h2>Crie sua conta</h2>
          <p>Leva menos de um minuto.</p>
        </header>
        <label className="field"><span>Nome</span><span className="field-control"><span className="leading-icon" aria-hidden="true">A</span><input autoComplete="name" value={props.name} onChange={event => props.onNameChange(event.target.value)} placeholder="Seu nome" autoFocus /></span></label>
        <label className="field"><span>E-mail</span><span className="field-control"><span className="leading-icon" aria-hidden="true">@</span><input type="email" autoComplete="email" value={props.email} onChange={event => props.onEmailChange(event.target.value)} placeholder="voce@email.com" /></span></label>
        <div className="field-grid">
          <label className="field"><span>Senha</span><span className="field-control"><input type={props.showPassword ? 'text' : 'password'} autoComplete="new-password" value={props.password} onChange={event => props.onPasswordChange(event.target.value)} placeholder="Mínimo 8 caracteres" /></span></label>
          <label className="field"><span>Confirmar senha</span><span className="field-control"><input type={props.showPassword ? 'text' : 'password'} autoComplete="new-password" value={props.confirmPassword} onChange={event => props.onConfirmPasswordChange(event.target.value)} placeholder="Repita a senha" /></span></label>
        </div>
        <label className="show-password"><input type="checkbox" checked={props.showPassword} onChange={props.onTogglePassword} /> Mostrar senhas</label>
        {props.error && <div className="auth-error" role="alert">{props.error}</div>}
        <button className="filled-button" disabled={props.loading}>{props.loading ? 'Criando conta…' : 'Criar minha conta'}</button>
        <p className="auth-switch">Já tem uma conta? <Link to="/entrar">Entrar</Link></p>
      </form>
    </AuthShell>
  );
}
