export const TABLE_HEAD =
  "text-muted-foreground truncate text-caption font-medium tracking-wide uppercase";

export const TABLE_ROW_LINK =
  "focus-visible:after:ring-ring outline-none after:absolute after:inset-0 after:rounded-control focus-visible:after:ring-2";

export const TABLE_HEAD_LINE_ON_CARD = "border-hairline border-b";
export const TABLE_ROWS_ON_CARD = "divide-hairline divide-y";
export const TABLE_ROW_LINE_ON_CANVAS =
  "after:border-border after:pointer-events-none after:absolute after:inset-x-2.5 after:bottom-0 after:border-b";

export const TABLE_SECONDARY = "hidden @min-[52rem]:block";

export const alignClass = (align: "start" | "end" | undefined) =>
  align === "end" ? "text-right" : undefined;
