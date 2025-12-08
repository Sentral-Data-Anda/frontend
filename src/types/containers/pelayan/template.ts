export interface FormTemplate {
  bapelId: string | null;
  name: string;
  startTime: string | null;
  endTime: string | null;
  detail: {
    order: number;
    rolePelayanId: string | null;
  }[];
}

export interface DaftarTemplate {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  bapel: string;
  detail: {
    order: number;
    roleName: string | null;
  }[];
}
