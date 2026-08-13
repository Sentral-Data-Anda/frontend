"use client";

import { useCallback, useState } from "react";

/**
 * Hook standar untuk state boolean (buka/tutup, toggle).
 * Mengikuti konvensi penamaan: nilai boolean `is*`, aksi `on*`.
 */
export function useBoolean(initial = false) {
  const [value, setValue] = useState(initial);

  const onTrue = useCallback(() => setValue(true), []);
  const onFalse = useCallback(() => setValue(false), []);
  const onToggle = useCallback(() => setValue((prev) => !prev), []);

  return { value, onTrue, onFalse, onToggle, setValue };
}
