import type { ServerAttachment } from "@/types/attachment";
import type { ApprovalStatus } from "@/types/persetujuan";

export type AssetStatus = "AKTIF" | "MENUNGGU_PELEPASAN" | "DILEPAS";

export type AssetCondition = "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT" | "HILANG";

export type AcquisitionSource = "PURCHASE" | "DONATION" | "GRANT";

export type DisposalMethod = "SOLD" | "SCRAPPED" | "DONATED" | "LOST";

type Relation = { id: number; code: string; name: string };

export type AssetDisposal = {
  code: string;
  method: DisposalMethod;
  disposalDate: string;
  status: "PENDING" | "APPROVED";
};

export type Asset = {
  publicId: string;
  code: string;
  name: string;
  description: string;
  serialNumber: string | null;
  condition: AssetCondition;
  acquisitionSource: AcquisitionSource;
  donorName: string | null;
  acquisitionDate: string | null;
  acquisitionCost: string | null;
  warrantyUntil: string | null;
  isDepreciable: boolean;
  salvageValue: string | null;
  usefulLifeMonths: number | null;
  depreciationStartDate: string | null;
  openingAccumulatedDepreciation: string | null;
  openingAccumulatedAsOf: string | null;
  type: Relation;
  bapel: Relation;
  room: Relation;
  mainImage: ServerAttachment | null;
  status: AssetStatus;
  disposal: AssetDisposal | null;
};

export type Period = { year: number; month: number };

export type AssetDetail = Omit<Asset, "disposal"> & {
  id: number;
  detailImage: ServerAttachment[];
  disposal:
    | (AssetDisposal & {
        approval: {
          publicId: string;
          code: string;
          status: ApprovalStatus;
        } | null;
      })
    | null;
  depreciation: {
    openingAccumulated: string;
    accumulated: string;
    bookValue: string;
    lastPeriod: Period | null;
  } | null;
};

export type CycleKind = "perawatan" | "mutasi" | "pelepasan";

type Place = { publicId: string; code: string; name: string };

export type MaintenanceStatus =
  "SCHEDULED" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type Maintenance = {
  code: string;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate: string | null;
  description: string;
};

export type Transfer = {
  code: string;
  transferDate: string;
  fromRoom: Place;
  toRoom: Place;
  fromBapel: Place;
  toBapel: Place;
};

export type Disposal = {
  code: string;
  status: ApprovalStatus;
  method: DisposalMethod;
  disposalDate: string;
  proceeds: string;
};
