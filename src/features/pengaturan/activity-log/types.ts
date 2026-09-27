export type LogAction = "create" | "update" | "delete";

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
};

export type ActionKind =
  "create" | "update" | "softDelete" | "restore" | "delete";

export type ActivityLogListItem = Omit<ActivityLog, "oldData" | "newData"> & {
  kind: ActionKind;
};
