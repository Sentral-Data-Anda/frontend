"use client";

import { createContext, useContext } from "react";

import type { Session } from "./types";

const SessionContext = createContext<Session | null>(null);

/**
 * Sesi diambil sekali di `(app)/layout.tsx` (Server Component) lalu dibagikan
 * dari sini. Tidak ada layar yang mengambilnya sendiri: satu panggilan per
 * navigasi, dan seluruh layar melihat sesi yang sama persis.
 *
 * React 19 memperbolehkan `<Context>` dipakai langsung sebagai provider;
 * `<Context.Provider>` masih bekerja tapi sudah tidak dianjurkan.
 */
export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  return <SessionContext value={session}>{children}</SessionContext>;
}

/**
 * Melempar, bukan mengembalikan null.
 *
 * Setiap pemakai hook ini berada di dalam `(app)`, yang layout-nya sudah
 * menendang sesi kosong ke `/login`. Kalau nilainya null di sini, yang terjadi
 * adalah komponen dipasang di luar provider — bug penataan, dan mengembalikan
 * null hanya memindahkan ledakannya ke tempat yang lebih sulit dibaca.
 */
export function useSession(): Session {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error("useSession dipakai di luar SessionProvider.");
  }

  return session;
}
