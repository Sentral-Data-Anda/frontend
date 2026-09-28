import type { ServerAttachment } from "@/types/attachment";

export type EventRelation = { id: number; code: string; name: string };

export type ChurchEvent = {
  id: number;
  code: string;
  name: string;
  description: string;
  isIndoor: boolean;
  location: string | null;
  capacity: number;
  isPaid: boolean;
  price: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  urlForm: string | null;
  isPublish: boolean;
  bapel: EventRelation;
  room: EventRelation | null;
  image: ServerAttachment | null;
  registeredCount: number;
};

export type EventSaved = { code: string };

export type EventStatus = "DRAFT" | "DONE" | "ONGOING" | "UPCOMING";

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "Draf",
  DONE: "Selesai",
  ONGOING: "Berlangsung",
  UPCOMING: "Akan datang",
};
