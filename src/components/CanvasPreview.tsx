"use client";

import { useRef, useEffect, useState } from "react";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Eye, EyeOff } from "lucide-react";
import { loadImage } from "@/lib/image";
import { useImageDimensions } from "@/hooks/useImageLoader";

interface CanvasPreviewProps {
  previewUrl: string;
  draw: (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
  title?: string;
  subtitle?: string;
  badge?: string;
  showCompare?: boolean;
}

export default function CanvasPreview({ previewUrl, draw, title = "Preview", subtitle, badge, showCompare }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [compare, setCompare] = useState(false);
  const dims = useImageDimensions(previewUrl);

  useEffect(() => {
    if (!previewUrl || !canvasRef.current) return undefined;
    let cancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    loadImage(previewUrl)
      .then((img) => {
        if (cancelled) return;
        draw(img, canvas, ctx);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [previewUrl, draw]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    else document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-2xl ${fullscreen ? "bg-[var(--bg-primary)] p-2" : ""}`}
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-[11px] font-bold tracking-widest" style={{ color: "var(--accent)" }}>{title.toUpperCase()}</span>
        {badge && <span className="hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex" style={{ backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" }}>{badge}</span>}
        {subtitle && <span className="hidden text-[11px] sm:inline" style={{ color: "var(--text-muted)" }}>• {subtitle}</span>}
        <div className="ml-auto flex items-center gap-1">
          {dims && <span className="hidden text-[11px] sm:inline" style={{ color: "var(--text-muted)" }}>{dims.w} × {dims.h}</span>}
          {showCompare && (
            <button onClick={() => setCompare((v) => !v)} className="rounded-lg border px-2 py-1 text-[11px] font-medium" style={{ backgroundColor: compare ? "var(--accent-soft)" : "var(--bg-secondary)", borderColor: compare ? "var(--accent)" : "var(--border)", color: compare ? "var(--accent)" : "var(--text-muted)" }}>
              {compare ? <><EyeOff className="mr-1 inline h-3 w-3" /> Original</> : <><Eye className="mr-1 inline h-3 w-3" /> Compare</>}
            </button>
          )}
          <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="hidden h-7 w-7 items-center justify-center rounded-lg border sm:flex" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}><ZoomIn className="h-3.5 w-3.5" /></button>
          <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="hidden h-7 w-7 items-center justify-center rounded-lg border sm:flex" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}><ZoomOut className="h-3.5 w-3.5" /></button>
          <button onClick={toggleFullscreen} className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}>{fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}</button>
        </div>
      </div>
      <div className="relative flex items-center justify-center overflow-auto p-2 sm:p-3" style={{ backgroundColor: "var(--bg-secondary)", maxHeight: fullscreen ? "85vh" : 520 }}>
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center", transition: "transform 0.15s ease" }}>
          <canvas ref={canvasRef} className="block max-h-[480px] max-w-full object-contain" style={{ backgroundColor: compare ? "var(--bg-secondary)" : "transparent" }} />
        </div>
        {subtitle && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium tracking-wide text-white backdrop-blur">{subtitle}</div>}
      </div>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{dims ? `${((dims.w * dims.h) / 1e6).toFixed(2)} MP` : ""} • {zoom}%</span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Live • 100% in browser</span>
      </div>
    </div>
  );
}
