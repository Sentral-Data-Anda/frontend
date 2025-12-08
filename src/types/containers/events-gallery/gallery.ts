import { Bapel } from "../user-management";

export interface ImageGallery {
  id: number;
  path: string;
  originalName: string;
  mimeType: string;
}

export interface Gallery {
  id: number;
  code: string;
  name: string;
  listImage: ImageGallery[];
  isPublish: boolean;
  bapel: Bapel;
}

export interface FormGallery {
  name: string;
  listImage: (File | undefined | null)[];
  bapelId: string | null;
  isPublish: string | undefined;
}
