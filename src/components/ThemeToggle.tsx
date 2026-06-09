"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return localStorage.getItem("theme") ?? "dark";
}

function getServerSnapshot() {
  return "dark";
}

export default function ThemeToggle() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dark = stored === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = useCallback(() => {
    const next = dark ? "light" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new StorageEvent("storage"));
  }, [dark]);

  return (
    <button onClick={toggle} className="btn-icon" aria-label="Toggle theme">
      {dark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
