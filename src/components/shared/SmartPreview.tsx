"use client";

import { useState, useRef } from "react";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Eye, EyeOff, Download, Image as ImageIcon } from "lucide-react";

interface SmartPreviewProps {
  previewUrl: string;
  fileName?: string;
  fileSize?: string;
  dims?: { w: number; h: number } | null;
  // Tool-specific
  title?: string; // e.g., "Preview" | "Crop Preview" | "Rotated 45°"
  subtitle?: string; // e.g., "1024×768 → 512×384"
  badge?: string; // e.g., "PNG • Lossless"
  showCompare?: boolean;
  onToggleCompare?: () => void;
  isCompareActive?: boolean;
  // For canvas-based previews, children is the canvas element
  children: React.ReactNode;
  // Extra actions in header
  headerAction?: React.ReactNode;
  // Footer extra info
  footerInfo?: React.ReactNode;
}

export function SmartPreview({
  previewUrl,
  fileName,
  fileSize,
  dims,
  title = "Preview",
  subtitle,
  badge,
  showCompare,
  onToggleCompare,
  isCompareActive,
  children,
  headerAction,
  footerInfo,
}: SmartPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-2xl ${fullscreen ? "bg-[var(--bg-primary)]" : ""}`}
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
          <span className="text-[11px] font-bold tracking-widest" style={{ color: "var(--accent)" }}>
            {title.toUpperCase()}
          </span>
          {badge && (
            <span className="hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex" style={{ backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" }}>
              {badge}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {dims && (
            <span className="hidden text-[11px] sm:inline" style={{ color: "var(--text-muted)" }}>
              {dims.w} × {dims.h}
            </span>
          )}
          {fileSize && <span className="hidden text-[11px] sm:inline" style={{ color: "var(--text-muted)" }}>• {fileSize}</span>}
          {showCompare && onToggleCompare && (
            <button
              onClick={onToggleCompare}
              className="ml-2 rounded-lg border px-2 py-1 text-[11px] font-medium"
              style={{ backgroundColor: isCompareActive ? "var(--accent-soft)" : "var(--bg-secondary)", borderColor: isCompareActive ? "var(--accent)" : "var(--border)", color: isCompareActive ? "var(--accent)" : "var(--text-muted)" }}
            >
              {isCompareActive ? <><EyeOff className="mr-1 inline h-3 w-3" /> Original</> : <><Eye className="mr-1 inline h-3 w-3" /> Compare</>}
            </button>
          )}
          {headerAction}
          <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="hidden h-7 w-7 items-center justify-center rounded-lg border sm:flex" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }} title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="hidden h-7 w-7 items-center justify-center rounded-lg border sm:flex" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }} title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button onClick={toggleFullscreen} className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }} title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="relative flex items-center justify-center overflow-auto p-2 sm:p-3" style={{ backgroundColor: "var(--bg-secondary)", maxHeight: fullscreen ? "85vh" : 520 }}>
        <div className="relative" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center", transition: "transform 0.15s ease" }}>
          {children}
        </div>
        {subtitle && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium tracking-wide text-white backdrop-blur">
            {subtitle}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {fileName && <span className="max-w-[140px] truncate font-medium sm:max-w-[200px]" style={{ color: "var(--text-primary)" }}>{fileName}</span>}
          {dims && <span className="hidden sm:inline">• {dims.w} × {dims.h} • {((dims.w * dims.h) / 1e6).toFixed(2)} MP</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {zoom}%
          </span>
          {footerInfo}
        </div>
      </div>
    </div>
  );
}

// Helper for simple image preview without canvas
export function SmartImagePreview(props: Omit<SmartPreviewProps, "children"> & { previewUrl: string }) {
  const { previewUrl, ...rest } = props;
  return (
    <SmartPreview previewUrl={previewUrl} {...rest}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt={props.fileName ?? "preview"} className="block max-h-[480px] max-w-full object-contain" draggable={false} />
    </SmartPreview>
  );
}
