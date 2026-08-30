export type UpdatePersonalDataRequest = {
  fullName: string;
  document?: string;
  phone?: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};
