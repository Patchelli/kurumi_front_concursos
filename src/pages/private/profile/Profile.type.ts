export type ProfileForm = {
  name: string;
  document: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ProfileViewProps = {
  firstName: string;
  email: string;
  form: ProfileForm;
  loading: boolean;
  loadingProfile: boolean;
  success: string;
  error: string;
  onFormChange(field: keyof ProfileForm, value: string): void;
  onSubmit(): void;
  onLogout(): void;
};
