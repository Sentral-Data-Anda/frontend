export type HolidayType = "NASIONAL" | "CUTI_BERSAMA" | "GEREJA";

export const HOLIDAY_TYPE_LABEL: Record<HolidayType, string> = {
  NASIONAL: "Nasional",
  CUTI_BERSAMA: "Cuti bersama",
  GEREJA: "Gereja",
};

export type Holiday = {
  id: number;
  publicId: string;
  date: string;
  name: string;
  type: HolidayType;
  isRecurring: boolean;
};

export type HolidayRow = Holiday & { originDate: string };

export type HolidayPayload = {
  date: string;
  name: string;
  type: HolidayType;
  isRecurring: boolean;
};
