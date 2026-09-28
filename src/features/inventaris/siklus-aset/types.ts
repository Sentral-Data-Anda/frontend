import type { ApprovalStatus } from "@/types/persetujuan";

export type CycleKind = "perawatan" | "pindah" | "pelepasan";

export type Place = { publicId: string; code: string; name: string };

export type MaintenanceStatus =
  "SCHEDULED" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type Maintenance = {
  id: number;
  publicId: string;
  code: string;
  assetId: number;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate: string | null;
  description: string;
  cost: string | null;
  supplierId: number | null;
  performedBy: string | null;
  asset: Place;
  supplier: Place | null;
};

export type Transfer = {
  id: number;
  publicId: string;
  code: string;
  assetId: number;
  transferDate: string;
  reason: string | null;
  asset: Place;
  fromRoom: Place;
  toRoom: Place;
  fromBapel: Place;
  toBapel: Place;
};

export type DisposalMethod = "SOLD" | "SCRAPPED" | "DONATED" | "LOST";

export type DisposalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type Disposal = {
  id: number;
  publicId: string;
  code: string;
  assetId: number;
  status: DisposalStatus;
  method: DisposalMethod;
  disposalDate: string;
  reason: string;
  proceeds: string;
  approvedAt: string | null;
  asset: Place;
  approval: { publicId: string; code: string; status: ApprovalStatus } | null;
};

export type AssetOption = {
  id: number;
  code: string;
  name: string;
  serialNumber: string | null;
  acquisitionCost: string | null;
  room: { id: number; name: string } | null;
  bapel: { id: number; name: string } | null;
};

export type MaintenancePayload = {
  assetId: number;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate?: string;
  description: string;
  cost?: number;
  supplierId?: number;
  performedBy?: string;
};

export type TransferPayload = {
  assetId: number;
  toRoomId: number;
  toBapelId: number;
  transferDate: string;
  reason?: string;
};

export type DisposalPayload = {
  assetId: number;
  method: DisposalMethod;
  disposalDate: string;
  reason: string;
  proceeds?: number;
};
