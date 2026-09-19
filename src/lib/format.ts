/**
 * Dua fungsi, karena be-sada mengirim DUA jenis nilai tanggal yang tidak boleh
 * diperlakukan sama (`be-sada/CODE_STYLE.md §12a`):
 *
 * - **Calendar date** — `birthDate`, `date`, `startPeriode`. Kolom Postgres
 *   `date`, dikirim sebagai tengah malam UTC. "9 Januari" adalah 9 Januari di
 *   Sabang maupun Merauke; tidak ada zona waktu yang terlibat.
 * - **Instant** — semua kolom berakhiran `At` (`createdAt`, `deletedAt`) plus
 *   `lastLogin`. Kolom `timestamptz`, sebuah momen nyata yang memang harus
 *   ditampilkan dalam zona pembacanya.
 *
 * Menggabungkan keduanya jadi satu fungsi adalah cara jebakan ini kembali:
 * satu formatter tanpa `timeZone` membuat `birthDate` "1990-01-09T00:00:00Z"
 * terbaca **8 Januari** di zona mana pun yang di sebelah barat UTC, dan
 * satu formatter ber-`timeZone: "UTC"` membuat `createdAt` sore hari WIB
 * terbaca sebagai hari sebelumnya.
 */

const calendarFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "UTC",
});

const instantFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
});

const onParse = (value: string | Date): Date | null => {
  const date = typeof value === "string" ? new Date(value) : value;

  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Calendar date (mis. "16 Juni 2026").
 *
 * `timeZone: "UTC"` bukan opsional: nilainya DISIMPAN sebagai tengah malam
 * UTC, jadi membacanya di zona lain menggeser harinya.
 */
export function formatDate(value: string | Date) {
  const date = onParse(value);

  return date ? calendarFormat.format(date) : "-";
}

/**
 * Instant (mis. "16 Juni 2026 pukul 09.30").
 *
 * Sengaja TANPA `timeZone`, sehingga dilokalkan ke zona perangkat pembaca —
 * itu memang arti sebuah `timestamptz`.
 */
export function formatDateTime(value: string | Date) {
  const date = onParse(value);

  return date ? instantFormat.format(date) : "-";
}
