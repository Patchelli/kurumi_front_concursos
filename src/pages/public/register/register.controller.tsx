import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticationService } from '../../../../@business/service/Authentication.service';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { saveAuthentication } from '../../../utils/authenticationStorage';
import { RegisterView } from './register.view';

export function RegisterController() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (name.trim().length < 2) return setError('Informe seu nome.');
    if (!email.trim()) return setError('Informe um e-mail válido.');
    if (password.length < 8) return setError('A senha deve ter no mínimo 8 caracteres.');
    if (password !== confirmPassword) return setError('As senhas não coincidem.');

    setLoading(true);
    setError('');
    try {
      const authentication = await authenticationService.register({ personalData: { fullName: name.trim() }, email: email.trim(), password });
      saveAuthentication(authentication);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Não foi possível criar sua conta.'));
    } finally {
      setLoading(false);
    }
  }

  return <RegisterView name={name} email={email} password={password} confirmPassword={confirmPassword} showPassword={showPassword} loading={loading} error={error} onNameChange={setName} onEmailChange={setEmail} onPasswordChange={setPassword} onConfirmPasswordChange={setConfirmPassword} onTogglePassword={() => setShowPassword(value => !value)} onSubmit={handleSubmit} />;
}
