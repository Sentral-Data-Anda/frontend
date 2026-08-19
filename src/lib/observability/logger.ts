/**
 * Logger terstruktur.
 *
 * Satu baris JSON per peristiwa, bukan kalimat bebas. Alasannya praktis: log
 * server berakhir di agregator (CloudWatch, Loki, Datadog, apa pun nanti), dan
 * di sana JSON bisa difilter per-field. Kalimat bebas hanya bisa dicari dengan
 * grep, dan itu tidak cukup saat sedang menelusuri satu insiden.
 *
 * Berkas ini adalah SATU-SATUNYA tempat `console` boleh dipakai di seluruh
 * repo. Aturan lint `no-console: "error"` sengaja dimatikan di sini saja,
 * supaya pemanggilan `console` yang tersebar di tempat lain tetap tertangkap.
 *
 * Ini juga titik sambung untuk penyedia observability nanti: menambahkan
 * Sentry atau sejenisnya cukup dilakukan di dalam fungsi-fungsi di bawah,
 * tanpa menyentuh satu pun pemanggilnya.
 */

type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function emit(level: LogLevel, event: string, fields: LogFields = {}): void {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  });

  /* eslint-disable no-console */
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
  /* eslint-enable no-console */
}

export const log = {
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields),
};
