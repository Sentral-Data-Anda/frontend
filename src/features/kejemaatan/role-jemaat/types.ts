type Ref = { id: number; code: string; name: string };

export type RoleJemaatItem = {
  id: number;
  publicId: string;
  name: string;
  startPeriode: string;
  endPeriode: string;
  status: boolean;
  jemaat: Ref;
  bapel: Ref | null;
};

export type RoleJemaatPayload = {
  name: string;
  startPeriode: string;
  endPeriode: string;
  status: boolean;
  jemaatId: number;
  bapelId: number;
};

export const ROLE_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Tidak aktif",
};
