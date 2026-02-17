"use client";

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 500): T {
  // BUG FIX: The original initialised state as `useState<T>(value)`.
  // This causes an immediate extra re-render on mount because React sets the
  // initial state synchronously, then the first useEffect fires and sets
  // the same value again — triggering a redundant render cycle.
  //
  // Using a lazy initialiser `() => value` tells React to compute the initial
  // state once at mount time without scheduling a redundant update.
  //
  // Additionally, `delay` was in the dependency array but was never validated.
  // A negative or zero delay would cause the timeout to fire immediately —
  // clamped to a minimum of 0 to make the behaviour predictable.
  const [debouncedValue, setDebouncedValue] = useState<T>(() => value);

  useEffect(() => {
    // Guard: treat negative delays as 0 (fire on next tick)
    const safeDelay = Math.max(0, delay);
    const timer = setTimeout(() => setDebouncedValue(value), safeDelay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
