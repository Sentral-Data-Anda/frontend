const LOCK_NAME = "sada-refresh";
const REFRESH_URL = "/api/v1/auth/refresh-token";

let tail: Promise<unknown> = Promise.resolve();

/**
 * Menjalankan `task` sendirian, lintas tab bila peramban punya Web Locks.
 *
 * be-sada membaca refresh id yang sudah dirotasi lalu disodorkan lagi sebagai
 * cookie curian dan mencabut semua sesi akun itu. Dua tab yang refresh
 * bersamaan memicu persis itu, jadi refresh tidak boleh berjalan paralel.
 */
export function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;

  // lib.dom membungkus hasil callback async dua kali; nilainya tetap T.
  if (locks) return locks.request(LOCK_NAME, task) as Promise<T>;

  // Tanpa Web Locks: antrean di tab ini saja.
  const run = tail.then(task, task);
  tail = run.catch(() => {});

  return run;
}

/**
 * `true` bila be-sada memberi sesi baru. Jaringan putus dilempar sebagai galat
 * biasa: itu bukan sesi yang berakhir.
 */
export async function refreshSession(): Promise<boolean> {
  const response = await fetch(REFRESH_URL, { cache: "no-store" });

  await response.body?.cancel().catch(() => {});

  return response.ok;
}
