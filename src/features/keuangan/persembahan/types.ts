import type {
  JournalRef,
  PersembahanStatus,
  ReceiveMethod,
} from "@/types/keuangan";

export type Person = { name: string };

export type Persembahan = {
  id: number;
  publicId: string;
  code: string;
  typePersembahan: {
    id: number;
    code: string;
    name: string;
    hasPeriod: boolean;
  };
  jemaat: { id: number; code: string; name: string } | null;
  donorName: string | null;
  period: string | null;
  amount: string;
  receiveMethod: ReceiveMethod;
  receivedDate: string;
  receivedBy: Person | null;
  ibadah: { id: number; code: string; date: string } | null;
  status: PersembahanStatus;
  voidReason: string | null;
  voidedAt: string | null;
  voidedBy: Person | null;
  journal: JournalRef | null;
  reversalJournal: JournalRef | null;
};

export type PersembahanTotals = { count: number; total: string };

export type PersembahanBatchItem = {
  typePersembahanId: number;
  jemaatId: number | null;
  period: string | null;
  donorName: string | null;
  amount: number;
};

export type PersembahanBatchPayload = {
  receivedDate: string;
  receiveMethod: "TUNAI" | "TRANSFER";
  ibadahId: number | null;
  receivedBy: number | null;
  items: PersembahanBatchItem[];
};

export type OfferingTypeOption = {
  id: number;
  code: string;
  name: string;
  hasPeriod: boolean;
  requiresJemaat: boolean;
  isActive: boolean;
  accountId?: number | null;
};

export type IbadahOption = {
  id: number;
  code: string;
  name: string;
  date: string;
};
