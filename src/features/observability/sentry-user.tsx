"use client";

import { useEffect } from "react";

import { useSession } from "@/features/auth";

import { clearUser, identifyUser } from "./identify-user";

export const SentryUser = () => {
  const session = useSession();

  useEffect(() => {
    identifyUser(session);

    return clearUser;
  }, [session]);

  return null;
};
