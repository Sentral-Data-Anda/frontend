"use client";

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
