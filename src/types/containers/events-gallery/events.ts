import { Ruangan } from "../ruangan";
import { Bapel } from "../user-management";

export interface EventImage {
  id: number;
  path: string;
  originalName: string;
  mimeType: string;
}

export interface Events {
  id: number;
  code: string;
  name: string;
  description: string;
  isIndoor: boolean;
  location: string;
  capacity: number;
  isPaid: boolean;
  price: number | string;
  startDate: string;
  endDate: string;
  image: EventImage;
  urlForm: string | undefined;
  isPublish: boolean;
  bapel: Bapel;
  room: Ruangan;
}

export interface FormEvents {
  name: string;
  description: string;
  isIndoor: string | undefined;
  location?: string;
  capacity: number | string;
  isPaid: string | undefined;
  price?: number | string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | undefined;
  endTime: string | undefined;
  image: File | undefined | null;
  urlForm?: string;
  isPublish: string | undefined;
  bapelId: string | null;
  roomId: string | null;
}
