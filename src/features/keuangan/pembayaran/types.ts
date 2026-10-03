import type { JournalRef, PaymentStatus } from "@/types/keuangan";

export const PAYMENT_PURPOSES = ["PERSEMBAHAN", "EVENT_REGISTRATION"] as const;

export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export type Payment = {
  id: number;
  publicId: string;
  code: string;
  purpose: PaymentPurpose;
  amount: string;
  status: PaymentStatus;
  method: string | null;
  paidAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  jemaat: { publicId: string; code: string; name: string } | null;
  donorName: string | null;
  typePersembahan: { code: string; name: string } | null;
  period: string | null;
  persembahan: { code: string } | null;
  journal: JournalRef | null;
};

export type PostingRange = {
  from: string;
  to: string;
};

export type PostingRefusal = {
  code: string;
  reason: string;
  reasonCode: string;
};

export type PostingResult = {
  posted: number;
  skipped: number;
  refused: PostingRefusal[];
};
