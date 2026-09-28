export type ServerAttachment = {
  publicId: string;
  name: string;
  mimeType: string;
  size: number;
  showOnWebsite: boolean;
  url: string;
};

export type AttachmentValue = {
  key: string;
  name: string;
  mimeType: string;
  url: string;
  showOnWebsite: boolean;
  file: File | null;
};

export type AttachmentAccept = "image" | "image-pdf";
