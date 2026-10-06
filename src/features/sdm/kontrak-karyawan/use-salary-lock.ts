"use client";

import { useEffect, useEffectEvent } from "react";

import { useBoolean } from "@/hooks/use-boolean";
import { useStepUp } from "@/hooks/use-step-up";
import { isStepUpRequired } from "@/lib/step-up";

export function useSalaryLock(error: unknown, onRetry: () => void) {
  const stepUp = useStepUp();
  const isAsking = useBoolean();
  const isLocked = isStepUpRequired(error);

  const onVerified = (expiresAt: string) => {
    stepUp.onGrant(expiresAt);
    isAsking.onFalse();
    onRetry();
  };

  const onLocked = useEffectEvent(() => {
    stepUp.onForget();
    isAsking.onTrue();
  });

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
