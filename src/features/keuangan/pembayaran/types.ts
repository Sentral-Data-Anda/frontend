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

// Satu definisi, bukan satu per fitur: dua bentuk yang kebetulan mirip akan
// menyimpang, dan yang menyimpang di sini adalah apa yang dilaporkan sebuah
// batch posting kepada bendahara.
export type { PostingRefusal, PostingResult } from "@/components/common/form";
