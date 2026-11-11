import { createContext, useContext } from "react";

import type { Session } from "./types";

const SessionContext = createContext<Session | null>(null);

interface PropTypes {
  session: Session;
  children: React.ReactNode;
}

export const SessionProvider = (props: PropTypes) => {
  const { session, children } = props;

  return <SessionContext value={session}>{children}</SessionContext>;
};

export function useSession(): Session {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error("useSession dipakai di luar SessionProvider.");
  }

  return session;
}

// Komponen bersama (mis. `PageHeader`) tetap bisa dirender tanpa provider,
// seperti pada test komponen; pemakai yang butuh sesi tetap memakai useSession.
export function useOptionalSession(): Session | null {
  return useContext(SessionContext);
}
