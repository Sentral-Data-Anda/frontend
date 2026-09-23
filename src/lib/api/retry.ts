import { FetchError } from "./fetcher";

/**
 * Kapan sebuah query diulang otomatis.
 *
 * Aturannya satu kalimat: **jawaban yang datang dari server tidak diulang,
 * permintaan yang tidak pernah sampai diulang.**
 *
 * `FetchError` berarti server sudah menjawab dengan status galat. 4xx berarti
 * permintaannya sendiri yang salah, dan 5xx berarti server sedang rusak —
 * keduanya tidak sembuh karena diulang. Yang dibayar user cuma waktu: dengan
 * tiga percobaan dan backoff, "Gagal memuat" baru muncul 7–12 detik setelah
 * klik, dan selama itu layar menahan kerangka seolah masih memuat.
 *
 * Galat jaringan (fetch gagal, DNS, koneksi putus, timeout) TIDAK membawa
 * status: permintaannya tidak pernah sampai. Itu yang paling sering sembuh
 * sendiri di jaringan jemaat, jadi ia tetap diulang dua kali.
 *
 * Tombol "Coba lagi" tetap ada di tiap layar untuk kasus yang memang perlu
 * diulang atas kehendak user.
 */
export const shouldRetryQuery = (
  failureCount: number,
  error: unknown,
): boolean => !(error instanceof FetchError) && failureCount < 2;
