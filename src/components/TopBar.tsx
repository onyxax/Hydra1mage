"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crop,
  Maximize,
  FileDown,
  ArrowRightLeft,
  RotateCw,
  ArrowDownLeft,
  Sun,
  Sparkles,
  Video,
  Info,
  LayoutGrid,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useImageContext } from "@/lib/image-context";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutGrid },
  { href: "/crop", label: "Crop", icon: Crop },
  { href: "/resize", label: "Resize", icon: Maximize },
  { href: "/compress", label: "Compress", icon: FileDown },
  { href: "/convert", label: "Convert", icon: ArrowRightLeft },
  { href: "/rotate", label: "Rotate", icon: RotateCw },
  { href: "/flip", label: "Flip", icon: ArrowDownLeft },
  { href: "/adjust", label: "Adjust", icon: Sun },
  { href: "/effects", label: "Effects", icon: Sparkles },
  { href: "/extract-thumbnail", label: "Thumbnail", icon: Video },
  { href: "/info", label: "Info", icon: Info },
];

export default function TopBar() {
  const pathname = usePathname();
  const { imageFile, handleClearImage } = useImageContext();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 border-b px-5 py-2.5"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="mr-2 flex items-center gap-2">
        <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="topbar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9A67A"/>
              <stop offset="100%" stopColor="#A07D58"/>
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#topbar-grad)"/>
          <g transform="translate(16,16)">
            <rect x="-6" y="-6" width="12" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.8" opacity="0.9"/>
            <rect x="-3" y="-3" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
            <line x1="6" y1="-6" x2="9" y2="-9" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.9"/>
            <line x1="-6" y1="6" x2="-9" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.9"/>
          </g>
        </svg>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Hydra1mage
        </span>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all duration-200"
              style={{
                backgroundColor: active ? "var(--accent-soft)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <span
          className="hidden text-[10px] tracking-wide lg:block"
          style={{ color: "var(--text-muted)" }}
        >
          Open source for all
        </span>

        <a
          href="https://github.com/onyxax/Hydra1mage"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
          title="View source on GitHub"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>

        <a
          href="https://guns.lol/onyxax"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden text-[10px] tracking-wide transition-all duration-200 sm:block"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          By onyxax
        </a>

        {imageFile && (
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 sm:flex" style={{ borderColor: "var(--border)" }}>
              <span className="max-w-[120px] truncate text-xs" style={{ color: "var(--text-muted)" }}>
                {imageFile.name}
              </span>
            </div>
            <button
              onClick={handleClearImage}
              className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
              aria-label="Clear image"
            >
              <X className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
