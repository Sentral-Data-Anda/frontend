// Penanda di /login bahwa pengguna tiba di sini karena sesinya berakhir.
export const SESSION_ENDED_REASON = "session-ended";

export const SESSION_ENDED_PATH = `/login?reason=${SESSION_ENDED_REASON}`;

// be-sada sudah menghapus cookie saat refresh gagal. Navigasi keras supaya
// cache TanStack Query ikut dibuang.
export const endSession = (): void => {
  if (typeof window === "undefined") return;

  window.location.replace(SESSION_ENDED_PATH);
};
