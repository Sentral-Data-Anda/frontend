import { Ruangan } from "../ruangan";
import { Bapel } from "../user-management";

export interface TipeBarang {
  id: number;
  code: string;
  name: string;
}

export interface FormTipeBarang {
  name: string;
}

export interface ImageBarang {
  id: number;
  path: string;
  originalName: string;
  mimeType: string;
}

export interface Barang {
  id: number;
  code: string;
  name: string;
  description: string;
  purchaseDate: string | null;
  purchasePrice: string | undefined | number;
  guaranty: string | undefined;
  quantity: number;
  maintainceDate?: string | null;
  maintainceInterval: string | undefined | number;
  maintenancePeriod: string | null;
  mainImage: ImageBarang;
  detailImage: ImageBarang[];
  type: TipeBarang;
  bapel: Bapel;
  room: Ruangan;
}

export interface FormBarang {
  name: string;
  description: string;
  purchaseDate?: string | null;
  purchasePrice?: string | undefined | number;
  guaranty?: string | undefined;
  quantity: number | string;
  maintainceDate?: string | null;
  maintainceInterval: string | undefined | number;
  maintenancePeriod: string | null;
  mainImage: File | undefined | null;
  image: (File | undefined | null)[];
  typeId: string | null;
  bapelId: string | null;
  roomId: string | null;
}
