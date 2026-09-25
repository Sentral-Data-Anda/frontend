"use client";

import { createContext, useContext } from "react";

import type { Session } from "./types";

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  return <SessionContext value={session}>{children}</SessionContext>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error("useSession dipakai di luar SessionProvider.");
  }

  return session;
}
