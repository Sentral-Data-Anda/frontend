export interface FormRoleJemaat {
  name: string;
  startPeriode: string | null;
  endPeriode: string | null;
  status: boolean;
  jemaatId: string | null;
  bapelId: string | null;
}

export interface RoleJemaat {
  id: number;
  name: string;
  startPeriode: string;
  endPeriode: string;
  status: boolean;
  jemaat: {
    id: number;
    code: string;
    name: string;
  };
  bapel: {
    id: number;
    code: string;
    name: string;
  };
}
