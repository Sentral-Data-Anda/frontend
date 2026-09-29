import type { ServerAttachment } from "@/types/attachment";
import type { ApprovalStatus } from "@/types/persetujuan";

export const REQUEST_STATUS_LABEL = {
  DRAFT: "Draf",
  PENDING_APPROVAL: "Menunggu persetujuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
} as const;

export type RequestStatus = keyof typeof REQUEST_STATUS_LABEL;

export const ORDER_STATUS_LABEL = {
  ISSUED: "Dipesan",
  PARTIALLY_RECEIVED: "Diterima sebagian",
  RECEIVED: "Diterima lengkap",
  CANCELLED: "Dibatalkan",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_LABEL;

export type RequestApproval = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  note: string | null;
  isSubmittedByViewer: boolean;
};

export type PurchaseRequest = {
  id: number;
  publicId: string;
  code: string;
  status: RequestStatus;
  purpose: string;
  neededDate: string | null;
  totalEstimatedIDR: string;
  bapelId: number;
  bapel: { publicId: string; code: string; name: string } | null;
  requestedBy: { name: string } | null;
  isRequestedByViewer: boolean;
  approval: RequestApproval | null;
  createdAt: string;
  itemCount: number;
};

export type PurchaseRequestItem = {
  publicId: string;
  name: string;
  quantity: number;
  estimatedUnitPrice: string;
};

export type PurchaseRequestDetail = Omit<PurchaseRequest, "itemCount"> & {
  items: PurchaseRequestItem[];
  orderedTotalIDR: string;
  orders: { code: string; status: OrderStatus; totalIDR: string }[];
  attachments: ServerAttachment[];
};

export type RequestAction = "pengajuan" | "tarik" | "hapus";
