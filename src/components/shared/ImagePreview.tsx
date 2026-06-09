"use client";

import { ImageIcon, X } from "lucide-react";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagePreview({
  previewUrl,
  fileName,
  fileSize,
  onClear,
}: {
  previewUrl: string;
  fileName: string;
  fileSize: string;
  onClear: () => void;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <ImageIcon className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            {fileName}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {fileSize}
          </p>
        </div>
        <button
          onClick={onClear}
          className="btn-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "transparent" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
          aria-label="Remove image"
        >
          <X className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={fileName}
        className="max-h-[400px] w-full object-contain"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      />
    </div>
  );
}
