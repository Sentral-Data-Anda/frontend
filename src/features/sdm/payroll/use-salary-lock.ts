"use client";

import { useEffect, useEffectEvent } from "react";

import { useBoolean } from "@/hooks/use-boolean";
import { isStepUpRequired } from "@/lib/step-up";

/**
 * 403 ber-`code` `STEP_UP_REQUIRED` berarti minta password lagi; 403 polos
 * adalah galat izin biasa dan jatuh ke jalur galat daftar seperti biasa —
 * `isStepUpRequired` membedakannya pada `code`, bukan pada status.
 *
 * Hibah step-up sengaja TIDAK ditahan di klien: gerbangnya server, layar ini
 * memang menampilkan gaji selama sesi terbuka, dan hibah yang nol pembacanya
 * terbaca sebagai kendali padahal bukan.
 *
 * Kembaran `kontrak-karyawan/use-salary-lock.ts` dan ia disengaja: `eslint
 * boundaries` melarang lintas-fitur, dan TL yang mengangkat keduanya ke lapis
 * bersama sesudah merge.
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
