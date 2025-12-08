export interface ImageRuangan {
  id: number;
  path: string;
  originalName: string;
  mimeType: string;
}

export interface Ruangan {
  id: number;
  code: string;
  name: string;
  capacity: number;
  mainImage: ImageRuangan;
  detailImage: ImageRuangan[];
}

export interface FormRuangan {
  name: string;
  capacity: number | string;
  mainImage: File | undefined | null;
  image: (File | undefined | null)[];
}
