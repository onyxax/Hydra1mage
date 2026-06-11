"use client";

import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface ToolCardProps {
  title: string;
  icon: LucideIcon;
  zone?: string;
  children: ReactNode;
}

export default function ToolCard({
  title,
  icon: Icon,
  zone,
  children,
}: ToolCardProps) {
  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3 sm:mb-5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          {zone && (
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {zone}
            </span>
          )}
          <h3
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
