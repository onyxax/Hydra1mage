"use client";

import { useState, useCallback } from "react";
import { ArrowDownLeft, ArrowRight, ArrowDown, FlipHorizontal, FlipVertical, RotateCcw, Download, Eye, EyeOff } from "lucide-react";
import ToolCard from "@/components/ToolCard";
import CanvasPreview from "@/components/CanvasPreview";
import DropZone from "@/components/DropZone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { loadImage, flipImage, downloadBlob, getExtensionFromMime } from "@/lib/image";
import type { ToolProps } from "./RotateTool";

export default function FlipTool({ imageFile, previewUrl, onFileSelect }: ToolProps) {
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const activeMode = flipH && flipV ? "both" : flipH ? "h" : flipV ? "v" : "none";

  const draw = useCallback(
    (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      if (showOriginal) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      } else {
        const flipped = flipImage(img, flipH, flipV);
        canvas.width = flipped.width;
        canvas.height = flipped.height;
        ctx.drawImage(flipped, 0, 0);
      }
    },
    [flipH, flipV, showOriginal]
  );

  const handleExport = async () => {
    if (!previewUrl) return;
    const img = await loadImage(previewUrl);
    const canvas = flipImage(img, flipH, flipV);
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = getExtensionFromMime(blob.type);
        const suffix = flipH && flipV ? "flipped-both" : flipH ? "flipped-h" : flipV ? "flipped-v" : "original";
        const name = imageFile?.name.replace(/\.[^.]+$/, `_${suffix}.${ext}`) || `${suffix}.${ext}`;
        downloadBlob(blob, name);
      }
    }, "image/png");
  };

  const modes = [
    { id: "none" as const, label: "Original", desc: "No flip", icon: Eye, active: activeMode === "none" },
    { id: "h" as const, label: "Horizontal", desc: "Mirror left ↔ right", icon: FlipHorizontal, active: activeMode === "h" },
    { id: "v" as const, label: "Vertical", desc: "Mirror top ↕ bottom", icon: FlipVertical, active: activeMode === "v" },
    { id: "both" as const, label: "Both", desc: "180° equivalent", icon: ArrowDownLeft, active: activeMode === "both" },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <ToolHeader title="Flip" subtitle="Mirror your image — instant preview" />

      {previewUrl ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-3">
            <CanvasPreview previewUrl={previewUrl} draw={draw} />
            <div className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
              <span className="flex items-center gap-2 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeMode === "none" ? "var(--text-muted)" : "var(--accent)" }} />
                {activeMode === "none" ? "Original" : activeMode === "h" ? "Flipped horizontally" : activeMode === "v" ? "Flipped vertically" : "Flipped both axes"}
              </span>
              <button onClick={() => setShowOriginal((v) => !v)} className="rounded-lg border px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: showOriginal ? "var(--accent-soft)" : "var(--bg-secondary)", borderColor: showOriginal ? "var(--accent)" : "var(--border)", color: showOriginal ? "var(--accent)" : "var(--text-muted)" }}>
                {showOriginal ? <><EyeOff className="mr-1 inline h-3 w-3" /> Show flipped</> : <><Eye className="mr-1 inline h-3 w-3" /> Show original</>}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <ToolCard title="Direction" icon={ArrowDownLeft} zone="Transform">
              <div className="grid grid-cols-2 gap-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (m.id === "none") { setFlipH(false); setFlipV(false); }
                      else if (m.id === "h") { setFlipH(true); setFlipV(false); }
                      else if (m.id === "v") { setFlipH(false); setFlipV(true); }
                      else { setFlipH(true); setFlipV(true); }
                    }}
                    className="group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: m.active ? "var(--accent-soft)" : "var(--bg-elevated)",
                      borderColor: m.active ? "var(--accent)" : "var(--border)",
                      boxShadow: m.active ? "0 0 0 2px var(--accent-soft)" : "none",
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: m.active ? "var(--accent)" : "var(--bg-secondary)", color: m.active ? "white" : "var(--text-muted)" }}>
                      <m.icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold" style={{ color: m.active ? "var(--accent)" : "var(--text-primary)" }}>
                        {m.label}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {m.desc}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setFlipH((h) => !h); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: flipH ? "var(--accent)" : "var(--bg-elevated)",
                    borderColor: flipH ? "var(--accent)" : "var(--border)",
                    color: flipH ? "white" : "var(--text-muted)",
                  }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  H
                </button>
                <button
                  onClick={() => { setFlipV((v) => !v); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: flipV ? "var(--accent)" : "var(--bg-elevated)",
                    borderColor: flipV ? "var(--accent)" : "var(--border)",
                    color: flipV ? "white" : "var(--text-muted)",
                  }}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  V
                </button>
              </div>

              <div className="rounded-xl border p-3" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--accent)" }}>
                    <FlipHorizontal className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {flipH && flipV ? "Both axes" : flipH ? "Horizontal" : flipV ? "Vertical" : "No transformation"}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {flipH && flipV ? "Equivalent to 180° rotation" : flipH ? "Left and right swapped" : flipV ? "Top and bottom swapped" : "Original orientation"}
                    </span>
                  </div>
                </div>
              </div>
            </ToolCard>

            <div className="flex gap-2">
              <button onClick={() => { setFlipH(false); setFlipV(false); }} className="flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-medium" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button onClick={handleExport} disabled={activeMode === "none"} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-40" style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
                <Download className="h-4 w-4" />
                Download Flipped
              </button>
            </div>
            <p className="text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
              Tip: use <span style={{ color: "var(--text-primary)" }}>H</span> / <span style={{ color: "var(--text-primary)" }}>V</span> to toggle quickly • Preview updates instantly
            </p>
          </div>
        </div>
      ) : (
        <DropZone onFileSelect={onFileSelect} />
      )}
    </div>
  );
}
