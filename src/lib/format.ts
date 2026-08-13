/** Format tanggal ke format Indonesia (mis. "16 Juni 2026"). */
export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}
