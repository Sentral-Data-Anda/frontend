export type EmploymentStatus = "ACTIVE" | "RESIGNED" | "TERMINATED";

export const EMPLOYMENT_STATUS_LABEL: Record<EmploymentStatus, string> = {
  ACTIVE: "Aktif",
  RESIGNED: "Berhenti",
  TERMINATED: "Diberhentikan",
};

export type JemaatRef = { id: number; code: string; name: string };

export type Karyawan = {
  id: number;
  publicId: string;
  code: string;
  jemaatId: number | null;
  jemaat: JemaatRef | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  position: string;
  joinDate: string;
  resignDate: string | null;
  status: EmploymentStatus;
};

export type KaryawanPayload = {
  jemaatId: number | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  position: string;
  joinDate: string;
  resignDate: string | null;
  status: EmploymentStatus;
};
