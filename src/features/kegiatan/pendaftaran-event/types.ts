export const REGISTRATION_STATUS_LABEL = {
  CONFIRMED: "Terkonfirmasi",
  PENDING_PAYMENT: "Menunggu pembayaran",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
} as const;

export type RegistrationStatus = keyof typeof REGISTRATION_STATUS_LABEL;

export const PAYMENT_STATUS_LABEL = {
  PENDING: "Menunggu pembayaran",
  PAID: "Lunas",
  EXPIRED: "Kedaluwarsa",
  FAILED: "Gagal",
  CANCELLED: "Dibatalkan",
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS_LABEL;

export type RegistrationEvent = {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string | null;
  isPaid: boolean;
  price: string | null;
};

export type RegistrationJemaat = {
  publicId: string;
  code: string;
  name: string;
};

type RegistrationBase = {
  publicId: string;
  code: string;
  participantName: string;
  participantPhone: string;
  status: RegistrationStatus;
  createdAt: string;
  event: RegistrationEvent;
  jemaat: RegistrationJemaat | null;
};

export type Registration = RegistrationBase & {
  payment: {
    status: PaymentStatus;
    amount: string;
    expiredAt: string | null;
  } | null;
};

export type Payment = {
  code: string;
  status: PaymentStatus;
  amount: string;
  invoiceUrl: string | null;
  expiredAt: string | null;
};

export type RegistrationDetail = RegistrationBase & {
  participantEmail: string | null;
  payment: Payment | null;
};

export type RegistrationPayload = {
  eventId: number;
  jemaatId: number | null;
  participantName?: string;
  participantPhone?: string;
  participantEmail?: string | null;
};

export type EventOption = {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime?: string | null;
  capacity: number;
  registeredCount: number;
  isPaid: boolean;
  price: string | null;
  isOpen: boolean;
  isFull?: boolean;
};
