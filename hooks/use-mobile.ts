"use client";

import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  // BUG FIX: The original typed state as `boolean | undefined` to represent
  // "not yet measured", but then returned `!!isMobile` which coerces `undefined`
  // to `false`. This means on the very first render (before the useEffect fires)
  // the hook always returns `false` — silently treating SSR/pre-hydration as
  // "not mobile". That's actually the correct safe default, but the `undefined`
  // type was misleading and caused TypeScript to think callers might receive
  // `undefined` even though they never could.
  //
  // BUG FIX: `window` is accessed inside a useEffect, which is fine — but the
  // initial state was also `undefined` (not a safe default value). We now
  // initialise with `false` explicitly so the return type is simply `boolean`.
  //
  // BUG FIX: The MediaQueryList `onChange` handler called `window.innerWidth`
  // instead of reading directly from the MediaQueryList `matches` property.
  // `window.innerWidth` can be slightly out of sync with the media query engine
  // when the resize event fires. Using `mql.matches` is more accurate and avoids
  // a second property access on `window`.
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mql.addEventListener("change", onChange);

    // Set the correct value immediately after mount (client-side only)
    setIsMobile(mql.matches);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
