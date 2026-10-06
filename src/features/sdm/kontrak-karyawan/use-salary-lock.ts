"use client";

import { useEffect, useEffectEvent } from "react";

import { useBoolean } from "@/hooks/use-boolean";
import { isStepUpRequired } from "@/lib/step-up";

/**
 * Hibah step-up sengaja TIDAK ditahan di klien. Gerbangnya server, layar ini
 * memang menampilkan gaji selama sesi terbuka, dan hibah yang nol pembacanya
 * terbaca sebagai kendali padahal bukan.
 */
export function useSalaryLock(error: unknown, onRetry: () => void) {
  const isAsking = useBoolean();
  const isLocked = isStepUpRequired(error);

  const onVerified = () => {
    isAsking.onFalse();
    onRetry();
  };

  const onLocked = useEffectEvent(() => isAsking.onTrue());

  useEffect(() => {
    if (isLocked) onLocked();
  }, [isLocked]);

  return {
    isLocked,
    isAsking: isAsking.value,
    onAsk: isAsking.onTrue,
    onClose: isAsking.onFalse,
    onVerified,
  };
}
