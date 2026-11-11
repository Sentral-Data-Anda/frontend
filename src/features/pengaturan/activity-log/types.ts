// Operasi Prisma yang dicatat be-sada. Varian `*Many` ikut dicatat sejak A3
// (docs/07-open-issues.md); `newData`-nya `{ count }` atau `data` yang ditulis,
// dan `recordId` hanya terisi bila `where.id` menyebut satu baris.
export type LogAction =
  | "create"
  | "update"
  | "delete"
  | "createMany"
  | "updateMany"
  | "deleteMany"
  // Bacaan yang dicatat be-sada sendiri (recordAccess): membuka satu catatan,
  // mengekspor log, dan memindahkan baris lama ke arsip.
  | "view"
  | "export"
  | "archive";

export type LogData = Record<string, unknown> | null;

export type ActivityLog = {
  id: number;
  action: LogAction;
  model: string;
  recordId: string | null;
  oldData: LogData;
  newData: LogData;
  createdAt: string;
  user?: { name: string; code?: string } | null;
  // Permintaan yang menulis baris ini. Null untuk baris lama, dan untuk tulisan
  // di luar permintaan (skrip, callback tanpa konteks).
  username?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
  requestId?: string | null;
};

export type ActionKind =
  | "create"
  | "update"
  | "softDelete"
  | "restore"
  | "delete"
  | "createMany"
  | "updateMany"
  | "deleteMany"
  | "view"
  | "export"
  | "archive";

export type LogKind =
  | "create"
  | "update"
  | "hapus"
  | "pulihkan"
  | "delete"
  | "createMany"
  | "updateMany"
  | "deleteMany"
  | "view"
  | "export"
  | "archive";

export type ActivityLogRow = Omit<ActivityLog, "oldData" | "newData"> & {
  kind: LogKind;
};

export type ActivityLogListItem = Omit<ActivityLog, "oldData" | "newData"> & {
  kind: ActionKind;
};
