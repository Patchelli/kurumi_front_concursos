import { useEffect, useMemo, useState } from 'react';
import { userService } from '@business/service/User.service';
import { updateStoredUserName } from '@utils/authenticationStorage';
import { getRequestErrorMessage } from '@utils/getRequestErrorMessage';
import { logoutMethod } from '@utils/logoutMethod';
import type { ProfileForm } from './Profile.type';
import { ProfileView } from './Profile.view';

const emptyForm: ProfileForm = {
  name: '',
  document: '',
  phone: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ProfileController() {
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('kurumi_concursos_user') ?? '{}') as { name?: string; email?: string; accessToken?: string }; } catch { return {}; } }, []);
  const [form, setForm] = useState<ProfileForm>({ ...emptyForm, name: user.name ?? '' });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    userService.getMyProfile()
      .then(profile => {
        if (!active) return;
        setForm({
          name: profile.personalData?.fullName ?? user.name ?? '',
          document: profile.personalData?.document ?? '',
          phone: profile.personalData?.phone ?? '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      })
      .catch(requestError => {
        if (active) setError(getRequestErrorMessage(requestError, 'Não foi possível carregar o perfil.'));
      })
      .finally(() => { if (active) setLoadingProfile(false); });
    return () => { active = false; };
  }, [user.name]);

  async function handleSubmit() {
    setError('');
    setSuccess('');

    const name = form.name.trim();
    if (name.length < 2) { setError('O nome deve ter pelo menos 2 caracteres.'); return; }
    const changingPassword = Boolean(form.currentPassword || form.newPassword || form.confirmPassword);
    if (changingPassword && !form.currentPassword) { setError('Informe a senha atual para alterá-la.'); return; }
    if (changingPassword && form.newPassword.length < 8) { setError('A nova senha deve ter pelo menos 8 caracteres.'); return; }
    if (changingPassword && form.newPassword !== form.confirmPassword) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      const updated = await userService.updatePersonalData({
        fullName: name,
        document: form.document.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      if (!updated) throw new Error('O perfil não foi atualizado.');
      if (changingPassword) {
        const passwordChanged = await userService.changePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
        if (!passwordChanged) throw new Error('A senha não foi alterada.');
      }
      updateStoredUserName(name);
      setForm(current => ({
        ...current,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setSuccess('Perfil atualizado com sucesso.');
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Não foi possível atualizar o perfil.'));
    } finally {
      setLoading(false);
    }
  }

  const firstName = form.name.trim().split(' ')[0] || user.name?.trim().split(' ')[0] || 'estudante';

  return <ProfileView
    firstName={firstName}
    email={user.email ?? ''}
    form={form}
    loading={loading}
    loadingProfile={loadingProfile}
    success={success}
    error={error}
    onFormChange={(field, value) => setForm(current => ({ ...current, [field]: value }))}
    onSubmit={handleSubmit}
    onLogout={logoutMethod}
  />;
}
