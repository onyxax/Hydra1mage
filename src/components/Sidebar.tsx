"use client";

import {
  ImageIcon,
  Crop,
  Maximize,
  FileDown,
  ArrowRightLeft,
  LayoutGrid,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export type TabId = "dashboard" | "crop" | "resize" | "compress" | "convert";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "crop", label: "Crop", icon: Crop },
  { id: "resize", label: "Resize", icon: Maximize },
  { id: "compress", label: "Compress", icon: FileDown },
  { id: "convert", label: "Convert", icon: ArrowRightLeft },
];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  imageFileName: string | null;
  onClearImage: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  imageFileName,
  onClearImage,
}: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-full w-[220px] flex-col border-r"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <div className="flex items-center gap-3 px-6 py-6">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <ImageIcon className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span
            className="text-sm font-medium tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Hydra1mage
          </span>
          <span
            className="text-[9px] tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            image tools
          </span>
        </div>
      </div>

      {imageFileName && (
        <div
          className="mx-4 mb-2 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-xs"
              style={{ color: "var(--text-primary)" }}
            >
              {imageFileName}
            </p>
          </div>
          <button
            onClick={onClearImage}
            className="btn-icon flex h-5 w-5 shrink-0 items-center justify-center"
            aria-label="Clear image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200"
              style={{
                backgroundColor: active ? "var(--accent-soft)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon
                className="h-4 w-4"
                style={{
                  color: active ? "var(--accent)" : "var(--text-muted)",
                }}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        className="mt-auto border-t px-4 py-4"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            theme
          </span>
          <ThemeToggle />
        </div>
        <p
          className="mt-3 text-[9px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          all processing runs locally
          <br />
          in your browser
        </p>
      </div>
    </aside>
  );
}
