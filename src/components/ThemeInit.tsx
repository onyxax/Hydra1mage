"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("theme");
      const dark =
        theme === "dark" ||
        (!theme &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    } catch {}
  }, []);

  return null;
}
