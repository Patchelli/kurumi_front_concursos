export type LoginViewProps = {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  onEmailChange(value: string): void;
  onPasswordChange(value: string): void;
  onTogglePassword(): void;
  onSubmit(): void;
};
