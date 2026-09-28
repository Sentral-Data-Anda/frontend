import type { ServerAttachment } from "@/types/attachment";

export type Album = {
  code: string;
  name: string;
  isPublish: boolean;
  bapel: { id: number; code: string; name: string };
  listImage: ServerAttachment[];
};

export type AlbumSaved = { code: string };

export const PUBLISH_LABEL: Record<"true" | "false", string> = {
  false: "Draf",
  true: "Terbit",
};
