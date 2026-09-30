export const ITEM_FIELDS = [
  "typePersembahanId",
  "jemaatId",
  "period",
  "amount",
  "donorName",
] as const;

export type ItemField = (typeof ITEM_FIELDS)[number];

export const ROW_LABEL = "text-muted-foreground mb-1 block text-caption";
