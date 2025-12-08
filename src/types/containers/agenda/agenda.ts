import { Bapel } from "../user-management";

export interface FormAgenda {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  purpose: string;
  jemaatId: string | null;
  roomId: string | null;
  bapelId: string | null;
}

export interface Agenda {
  id: number;
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  bapel: Bapel;
  room: {
    code: string;
    name: string;
    image: string[];
  };
  jemaat: {
    code: string;
    name: string;
    gender: string;
  };
  createdBy: number;
}

export interface BookingAgenda {
  code: string;
  name: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  roomId: number;
}
