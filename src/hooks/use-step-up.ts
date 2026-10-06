"use client";

import { useEffect, useState } from "react";

/**
 * Hibah step-up yang ditahan di memori saja, dan dijatuhkan begitu tab
 * disembunyikan. Dipakai setiap layar yang membaca data ber-`StepUp`.
 */
export function useStepUp() {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const isHeld = expiresAt !== null;

  const onGrant = (iso: string) => setExpiresAt(Date.parse(iso));

  const onForget = () => setExpiresAt(null);

  const isActive = () => expiresAt !== null && Date.now() < expiresAt;

  useEffect(() => {
    if (!isHeld) return;

    const onVisibilityChange = () => {
      if (document.hidden) setExpiresAt(null);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isHeld]);

  return { isActive, onGrant, onForget };
}
