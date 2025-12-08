"use client";

import { useCallback, useMemo, useState } from "react";

export function useBoolean(defaultValue: boolean = false) {
  const [value, setValue] = useState<boolean>(defaultValue);

  const onTrue = useCallback(() => {
    setValue(true);
  }, []);

  const onFalse = useCallback(() => {
    setValue(false);
  }, []);

  const onToggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const memoizedValue = useMemo(
    () => ({
      value,
      onTrue,
      onFalse,
      onToggle,
      setValue,
    }),
    [value, onTrue, onFalse, onToggle, setValue],
  );

  return memoizedValue;
}
