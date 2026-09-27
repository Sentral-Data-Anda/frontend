"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect, useEffectEvent } from "react";

import { useBoolean } from "@/hooks/use-boolean";

export function useReveal(queryKey: QueryKey) {
  const queryClient = useQueryClient();
  const isShown = useBoolean();

  const onHide = () => {
    isShown.onFalse();
    queryClient.removeQueries({ queryKey });
  };

  const onHidden = useEffectEvent(onHide);

  const onToggle = () => {
    if (isShown.value) onHide();
    else isShown.onTrue();
  };

  useEffect(() => {
    if (!isShown.value) return;

    const onVisibilityChange = () => {
      if (document.hidden) onHidden();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isShown.value]);

  return { isShown: isShown.value, onShow: isShown.onTrue, onHide, onToggle };
}
