"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

function getSystemDark() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true; // fallback to dark to match previous default
  }
}

function subscribe(callback: () => void) {
  const onStorage = () => callback();
  const mql = (() => {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return null;
    }
  })();

  window.addEventListener("storage", onStorage);
  const onSystem = () => {
    // Only notify when user has no explicit choice — otherwise system change is irrelevant
    try {
      if (!localStorage.getItem("theme")) callback();
    } catch {}
  };
  mql?.addEventListener("change", onSystem);

  return () => {
    window.removeEventListener("storage", onStorage);
    mql?.removeEventListener("change", onSystem);
  };
}

function getSnapshot() {
  try {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;
    return getSystemDark() ? "dark" : "light";
  } catch {
    return "dark";
  }
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
    // Notify same-tab listeners (storage event only fires cross-tab)
    window.dispatchEvent(new StorageEvent("storage"));
    // Also ensure class is updated immediately (subscribe will also fire via storage listener)
    try {
      document.documentElement.classList.toggle("dark", next === "dark");
    } catch {}
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
