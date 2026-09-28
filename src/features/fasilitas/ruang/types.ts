import type { SelectOption } from "@/components/common/control";
import type { ServerAttachment } from "@/types/attachment";

export type Room = {
  publicId: string;
  code: string;
  name: string;
  capacity: number;
  isActive: boolean;
  mainImage: ServerAttachment | null;
};

export type RoomDetail = Room & {
  id: number;
  detailImage: ServerAttachment[];
};

export type UsageKind = "LOAN" | "IBADAH" | "EVENT";

export type RoomUsage = {
  kind: UsageKind;
  code: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
};

export const USAGE_KIND_LABEL: Record<UsageKind, string> = {
  LOAN: "Peminjaman",
  IBADAH: "Ibadah",
  EVENT: "Event",
};

export const ROOM_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Nonaktif",
};

export const ROOM_STATUS_FILTER: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: ROOM_STATUS_LABEL.true, value: "aktif" },
  { label: ROOM_STATUS_LABEL.false, value: "nonaktif" },
];
