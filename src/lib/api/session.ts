import { SESSION_ENDED_PATH } from "./cookie";

// 401 yang bertahan sampai browser berarti sesi sudah mati; "Coba lagi" hanya
// mengulanginya. Navigasi keras supaya cache TanStack Query ikut dibuang.
export const endSession = (): void => {
  if (typeof window === "undefined") return;

  window.location.replace(SESSION_ENDED_PATH);
};
