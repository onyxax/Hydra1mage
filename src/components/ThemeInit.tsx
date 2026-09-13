"use client";

import { useEffect } from "react";

// Runs once after hydration to keep <html> in sync with system when user has no explicit choice,
// and to listen for system changes (e.g., OS toggles dark/light while tab is open).
export function ThemeInit() {
  useEffect(() => {
    const apply = () => {
      try {
        const stored = localStorage.getItem("theme");
        // If user has explicit choice, respect it. Otherwise follow system.
        const dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", dark);
      } catch {}
    };

    apply();

    // Follow system when no explicit stored preference
    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        if (!localStorage.getItem("theme")) apply();
      };
      mql.addEventListener("change", onChange);
      window.addEventListener("storage", onChange);
      return () => {
        mql?.removeEventListener("change", onChange);
        window.removeEventListener("storage", onChange);
      };
    } catch {
      return;
    }
  }, []);

  return null;
}

// Inline blocking script — runs *before* React hydration, inside <head>, to avoid FOUC.
// Sets .dark synchronously based on stored choice or system preference.
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
