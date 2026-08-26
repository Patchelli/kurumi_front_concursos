import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticationService } from '../../../../@business/service/Authentication.service';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { saveAuthentication } from '../../../utils/authenticationStorage';
import { LoginView } from './login.view';

export function LoginController() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Informe seu e-mail e sua senha.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const authentication = await authenticationService.login({ email: email.trim(), password });
      saveAuthentication(authentication);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'E-mail ou senha inválidos.'));
    } finally {
      setLoading(false);
    }
  }

  return <LoginView email={email} password={password} showPassword={showPassword} loading={loading} error={error} onEmailChange={setEmail} onPasswordChange={setPassword} onTogglePassword={() => setShowPassword(value => !value)} onSubmit={handleSubmit} />;
}
