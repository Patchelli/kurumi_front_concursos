export type AdminUserResponse = {
  userId: string;
  email: string;
  name?: string;
  status: number;
  roles: string[];
  createdAt?: string;
};
