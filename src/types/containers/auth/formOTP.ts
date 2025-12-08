export interface PropsFormOTP {
  verifyUpdate: (_value: number) => Promise<void>;
  loadingVerify: boolean;
  statusVerify: number;
  messageVerify: string;
  errorVerify: string;
  resetVerify: () => void;

  resendOTP: () => Promise<void>;
  loadingResendOTP: boolean;
  statusResendOTP: number;
  messageResendOTP: string;
  errorResendOTP: string;
  resetResendOTP: () => void;
}
