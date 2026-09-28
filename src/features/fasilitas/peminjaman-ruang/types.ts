export type LoanRelation = { code: string; name: string };

export type LoanRelationDetail = LoanRelation & { id: number };

export type LoanRoom = {
  publicId: string;
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  room: LoanRelation;
  bapel: LoanRelation | null;
  jemaat: LoanRelation;
};

export type LoanRoomDetail = Omit<LoanRoom, "room" | "bapel" | "jemaat"> & {
  room: LoanRelationDetail;
  bapel: LoanRelationDetail | null;
  jemaat: LoanRelationDetail;
};

export type LoanPayload = {
  roomId: number;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  jemaatId: number;
  bapelId?: number;
};

export type LoanSaved = { code: string };

export type BookingKind = "LOAN" | "IBADAH" | "EVENT";

export type RoomBooking = {
  kind: BookingKind;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  bapel: { name: string } | null;
};

export type Clash = Omit<RoomBooking, "bapel">;

export type CheckResult = { date: string; clashes: Clash[] };

export type CheckBody = {
  roomId: number;
  startTime: string;
  endTime: string;
  dates: string[];
};

export type LoanStatus = "UPCOMING" | "ONGOING" | "DONE";

export const LOAN_STATUS_LABEL: Record<LoanStatus, string> = {
  UPCOMING: "Akan datang",
  ONGOING: "Berlangsung",
  DONE: "Selesai",
};

export const BOOKING_KIND_LABEL: Record<BookingKind, string> = {
  LOAN: "Peminjaman",
  IBADAH: "Ibadah",
  EVENT: "Event",
};

export type RepeatMode = "ONCE" | "WEEKLY";

export const REPEAT_LABEL: Record<RepeatMode, string> = {
  ONCE: "Sekali",
  WEEKLY: "Tiap minggu",
};

export const WEEKDAY_LABEL: Record<string, string> = {
  "0": "Senin",
  "1": "Selasa",
  "2": "Rabu",
  "3": "Kamis",
  "4": "Jumat",
  "5": "Sabtu",
  "6": "Minggu",
};
