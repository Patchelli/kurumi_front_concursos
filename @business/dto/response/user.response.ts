export type PersonalDataResponse = {
  fullName?: string;
  document?: string;
  phone?: string;
};

export type UserProfileResponse = {
  userId: string;
  email: string;
  status: number;
  roles: string[];
  personalData?: PersonalDataResponse;
};
