export type AdminUser = {
  userId: string;
  email: string;
  name?: string;
  status: number;
  roles: string[];
  createdAt?: string;
};

export type AdminUsersViewProps = {
  users: AdminUser[];
  filtered: AdminUser[];
  search: string;
  loading: boolean;
  confirmTarget: AdminUser | null;
  onSearchChange(value: string): void;
  onRequestToggle(user: AdminUser): void;
  onConfirmToggle(): void;
  onCancelToggle(): void;
  firstName: string;
  onLogout(): void;
};
