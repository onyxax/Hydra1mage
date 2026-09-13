"use client";

import Link from "next/link";
import { X, FileImage } from "lucide-react";
import { NAV_ITEMS, NAV_GROUPS } from "./nav-items";
import { HydraLogo } from "./Logo";
import ThemeToggle from "../ThemeToggle";
import { shortFileName } from "@/lib/format";

interface Props {
  pathname: string;
  fileName?: string | null;
  onClear?: () => void;
}

export function DesktopTopBar({ pathname, fileName, onClear }: Props) {
  const homeActive = pathname === "/";
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 hidden border-b backdrop-blur-xl md:flex"
      style={{ backgroundColor: "color-mix(in srgb, var(--bg-primary) 92%, transparent)", borderColor: "var(--border-subtle)" }}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-5 py-2">
        {/* ── Brand — premium lockup ── */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 rounded-xl px-2 py-1 -ml-2 transition-all duration-200"
          aria-label="Hydra1mage — home"
        >
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.14), 0 4px 12px rgba(184,146,106,0.18)", border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)" }}>
            <HydraLogo size={30} gradientId="topbar-grad" />
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="text-[14.5px] font-bold leading-none tracking-tight"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.025em", fontFeatureSettings: '"ss01"' }}
            >
              Hydra1mage
            </span>
            <span
              className="hidden items-center gap-1 rounded-full px-2 py-1 text-[8px] font-extrabold tracking-[0.14em] lg:inline-flex"
              style={{
                backgroundColor: "var(--accent-soft)",
                color: "var(--accent)",
                border: "1px solid color-mix(in srgb, var(--accent) 16%, transparent)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              <span className="h-1 w-1 animate-pulse rounded-full" style={{ backgroundColor: "var(--accent)" }} />
              OPEN SOURCE
            </span>
          </div>
        </Link>

        <div className="mx-2 hidden h-6 w-px shrink-0 lg:block" style={{ backgroundColor: "var(--border-subtle)" }} />

        {/* ── Navigation — organized in 4 groups + Home ── */}
        <nav className="flex min-w-0 flex-1 items-center gap-0 overflow-x-auto scrollbar-none" aria-label="Primary">
          {/* Home — distinct */}
          {(() => {
            const home = NAV_ITEMS[0];
            return (
              <Link
                key={home.href}
                href={home.href}
                className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  backgroundColor: homeActive ? "var(--bg-elevated)" : "transparent",
                  color: homeActive ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: homeActive ? "var(--shadow-sm)" : "none",
                  border: homeActive ? "1px solid var(--border)" : "1px solid transparent",
                }}
              >
                <home.icon className="h-3.5 w-3.5" />
                {home.label}
              </Link>
            );
          })()}

          <div className="mx-2 h-4 w-px shrink-0" style={{ backgroundColor: "var(--border-subtle)" }} />

          {NAV_GROUPS.map((group, idx) => (
            <div key={group.label} className="flex items-center gap-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={group.label}
                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-all duration-200"
                    style={{
                      backgroundColor: active ? "var(--accent-soft)" : "transparent",
                      color: active ? "var(--accent)" : "var(--text-muted)",
                      border: active ? "1px solid var(--accent)" : "1px solid transparent",
                    }}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
              {idx < NAV_GROUPS.length - 1 && (
                <div className="mx-1.5 h-4 w-px shrink-0" style={{ backgroundColor: "var(--border-subtle)" }} />
              )}
            </div>
          ))}
        </nav>

        {/* ── Actions — file + (md-xl) quick actions; on xl+ these move to floating dock ── */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {fileName ? (
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="hidden min-w-0 max-w-[200px] items-center gap-2 overflow-hidden rounded-xl border px-3 py-1.5 sm:flex"
                style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
                title={fileName}
              >
                <FileImage className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                <span className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {shortFileName(fileName)}
                </span>
                <span className="hidden h-3 w-px shrink-0 xl:block" style={{ backgroundColor: "var(--border-subtle)" }} />
                <span className="hidden text-[10px] font-medium xl:block" style={{ color: "var(--accent)" }}>
                  active
                </span>
              </div>
              <button
                onClick={onClear}
                className="flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-[1.03]"
                style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-secondary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
                }}
                aria-label="Clear image"
                title="Clear image"
              >
                <X className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
          ) : (
            <span className="hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium tracking-wide xl:flex" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)", backgroundColor: "var(--bg-secondary)" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--accent)", opacity: 0.6 }} />
              No image
            </span>
          )}

          {/* md-xl fallback — hidden on xl where dock takes over */}
          <div className="hidden h-6 w-px shrink-0 lg:block xl:hidden" style={{ backgroundColor: "var(--border-subtle)" }} />
          <a
            href="https://github.com/onyxax/Hydra1mage"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 lg:flex xl:hidden"
            style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            title="View source on GitHub"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden xl:inline">GitHub</span>
          </a>
          <div className="hidden xl:hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
