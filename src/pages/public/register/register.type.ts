export type RegisterViewProps = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  onNameChange(value: string): void;
  onEmailChange(value: string): void;
  onPasswordChange(value: string): void;
  onConfirmPasswordChange(value: string): void;
  onTogglePassword(): void;
  onSubmit(): void;
};
