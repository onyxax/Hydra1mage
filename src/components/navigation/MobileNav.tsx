"use client";

import Link from "next/link";
import { X, Menu } from "lucide-react";
import { NAV_ITEMS, NAV_GROUPS } from "./nav-items";
import { HydraLogo } from "./Logo";
import ThemeToggle from "../ThemeToggle";
import { shortFileName } from "@/lib/format";

interface MobileTopProps {
  fileName?: string | null;
  onClear?: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function MobileTopBar({ fileName, onClear, open, setOpen }: MobileTopProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl md:hidden"
      style={{ backgroundColor: "color-mix(in srgb, var(--bg-primary) 92%, transparent)", borderColor: "var(--border-subtle)" }}
    >
      <Link href="/" className="group flex items-center gap-2.5 rounded-lg px-1 py-1 -ml-1" aria-label="Hydra1mage — home">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-[8px]"
          style={{
            boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
            border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
          }}
        >
          <HydraLogo size={28} gradientId="sb-m-grad" />
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
          Hydra1mage
        </span>
        <span
          className="hidden items-center rounded-full border px-1.5 py-0.5 text-[7px] font-bold tracking-widest sm:inline-flex"
          style={{
            backgroundColor: "var(--accent-soft)",
            borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
            color: "var(--accent)",
          }}
        >
          OS
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {fileName && (
          <>
            <div className="h-5 w-px shrink-0" style={{ backgroundColor: "var(--border-subtle)" }} />
            <span
              className="max-w-[110px] truncate text-[10px] font-medium sm:max-w-[140px]"
              style={{ color: "var(--text-muted)" }}
              title={fileName}
            >
              {shortFileName(fileName)}
            </span>
            <button
              onClick={onClear}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-200"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "transparent" }}
              aria-label="Clear image"
            >
              <X className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
            </button>
          </>
        )}
        <ThemeToggle />
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "transparent" }}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" style={{ color: "var(--text-primary)" }} /> : <Menu className="h-4 w-4" style={{ color: "var(--text-primary)" }} />}
        </button>
      </div>
    </header>
  );
}

interface DrawerProps {
  pathname: string;
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function MobileDrawer({ pathname, open, setOpen }: DrawerProps) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
      <nav
        className="fixed top-0 right-0 z-50 flex h-full w-64 flex-col border-l md:hidden overflow-hidden"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-subtle)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5" aria-label="Hydra1mage — home">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-[8px]"
              style={{
                boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
              }}
            >
              <HydraLogo size={28} gradientId="sb-m2-grad" />
            </div>
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
              Hydra1mage
            </span>
            <span
              className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[7px] font-bold tracking-widest"
              style={{
                backgroundColor: "var(--accent-soft)",
                borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
                color: "var(--accent)",
              }}
            >
              OS
            </span>
          </Link>
          <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg" aria-label="Close menu">
            <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-5">
            {/* Home单独 */}
            <div>
              {(() => {
                const home = NAV_ITEMS[0];
                const active = pathname === home.href;
                return (
                  <Link
                    href={home.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: active ? "var(--bg-elevated)" : "transparent",
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      border: active ? "1px solid var(--border)" : "1px solid transparent",
                      boxShadow: active ? "var(--shadow-sm)" : "none",
                    }}
                  >
                    <home.icon className="h-4 w-4" />
                    {home.label}
                  </Link>
                );
              })()}
            </div>

            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <span className="px-4 text-[10px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {group.label}
                </span>
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
                      style={{
                        backgroundColor: active ? "var(--accent-soft)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-secondary)",
                        border: active ? "1px solid var(--accent)" : "1px solid transparent",
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <a
            href="https://github.com/onyxax/Hydra1mage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
          <p className="mt-3 text-center text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Open source for all
          </p>
          <p className="mt-1.5 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            by{" "}
            <a
              href="https://guns.lol/onyxax"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline transition-colors duration-200"
              style={{ color: "var(--accent)" }}
            >
              onyxax
            </a>
          </p>
        </div>
      </nav>
    </>
  );
}
