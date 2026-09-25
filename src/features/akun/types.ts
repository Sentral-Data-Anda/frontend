export type OfferingItem = {
  code: string;
  amount: string;
  period: string | null;
  receivedDate: string;
  typePersembahan: { name: string };
};

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};
