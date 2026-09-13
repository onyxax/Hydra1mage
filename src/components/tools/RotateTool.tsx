"use client";

import { useState, useCallback } from "react";
import { RotateCw, RotateCcw, Download, Eye, EyeOff, Compass, Gauge } from "lucide-react";
import ToolCard from "@/components/ToolCard";
import CanvasPreview from "@/components/CanvasPreview";
import DropZone from "@/components/DropZone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { useImageDimensions } from "@/hooks/useImageLoader";
import { loadImage, rotateImage, downloadBlob, getExtensionFromMime } from "@/lib/image";

export interface ToolProps {
  imageFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClearImage: () => void;
}

export default function RotateTool({ imageFile, previewUrl, onFileSelect }: ToolProps) {
  const [degrees, setDegrees] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const imgNatural = useImageDimensions(previewUrl);

  const drawPreview = useCallback(
    (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      if (showOriginal) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      } else {
        const result = rotateImage(img, degrees);
        canvas.width = result.width;
        canvas.height = result.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(result, 0, 0);
      }
    },
    [degrees, showOriginal]
  );

  const presets = [
    { label: "90°", sub: "Right", value: 90, icon: "↻" },
    { label: "180°", sub: "Flip", value: 180, icon: "⇅" },
    { label: "270°", sub: "Left", value: 270, icon: "↺" },
    { label: "-90°", sub: "Left 90", value: -90, icon: "↺" },
  ];

  const newDims = (() => {
    if (!imgNatural) return null;
    const rad = (degrees * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
    const w = imgNatural.w, h = imgNatural.h;
    return { w: Math.floor(w * cos + h * sin), h: Math.floor(w * sin + h * cos) };
  })();

  const handleExport = async () => {
    if (!previewUrl) return;
    const img = await loadImage(previewUrl);
    const canvas = rotateImage(img, degrees);
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = getExtensionFromMime(blob.type);
        const name = imageFile?.name.replace(/\.[^.]+$/, `_rotated-${degrees}deg.${ext}`) || `rotated-${degrees}deg.${ext}`;
        downloadBlob(blob, name);
      }
    }, "image/png");
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <ToolHeader title="Rotate" subtitle="Precise rotation — presets or free angle" />

      {previewUrl ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-3">
            <CanvasPreview previewUrl={previewUrl} draw={drawPreview} />
            <div className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
              <span className="flex items-center gap-2 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                <Compass className="h-3.5 w-3.5" style={{ color: degrees === 0 ? "var(--text-muted)" : "var(--accent)" }} />
                {degrees === 0 ? "Original • No rotation" : `Rotated ${degrees > 0 ? "+" : ""}${degrees}°`}
                {newDims && <span className="hidden sm:inline" style={{ color: "var(--text-muted)" }}> • {newDims.w} × {newDims.h}px</span>}
              </span>
              <button onClick={() => setShowOriginal((v) => !v)} className="rounded-lg border px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: showOriginal ? "var(--accent-soft)" : "var(--bg-secondary)", borderColor: showOriginal ? "var(--accent)" : "var(--border)", color: showOriginal ? "var(--accent)" : "var(--text-muted)" }}>
                {showOriginal ? <><EyeOff className="mr-1 inline h-3 w-3" /> Show rotated</> : <><Eye className="mr-1 inline h-3 w-3" /> Show original</>}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <ToolCard title="Quick presets" icon={Compass} zone="Presets">
              <div className="grid grid-cols-4 gap-2">
                {presets.map((p) => {
                  const active = degrees === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setDegrees(p.value)}
                      className="flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: active ? "var(--accent)" : "var(--bg-elevated)",
                        borderColor: active ? "var(--accent)" : "var(--border)",
                        color: active ? "white" : "var(--text-muted)",
                        boxShadow: active ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: active ? "white" : "var(--text-primary)" }}>{p.icon}</span>
                      <span className="text-xs font-bold" style={{ color: active ? "white" : "var(--text-primary)" }}>{p.label}</span>
                      <span className="text-[10px]" style={{ color: active ? "rgba(255,255,255,0.8)" : "var(--text-muted)" }}>{p.sub}</span>
                    </button>
                  );
                })}
              </div>
            </ToolCard>

            <ToolCard title="Free angle" icon={Gauge} zone="Precise">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>ANGLE</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums" style={{ backgroundColor: degrees === 0 ? "var(--bg-secondary)" : "var(--accent-soft)", borderColor: degrees === 0 ? "var(--border)" : "var(--accent)", color: degrees === 0 ? "var(--text-muted)" : "var(--accent)" }}>
                      {degrees > 0 ? `+${degrees}°` : `${degrees}°`}
                    </span>
                  </div>
                </div>

                <div className="relative py-2">
                  <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: "var(--border-subtle)" }} />
                  <div className="absolute left-1/2 top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: "var(--accent)", opacity: 0.3 }} />
                  <input type="range" min={-180} max={180} value={degrees} onChange={(e) => setDegrees(Number(e.target.value))} className="relative h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[var(--accent)]" />
                </div>
                <div className="flex justify-between text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                  <span>-180°</span>
                  <span className="rounded-full border px-2 py-0.5 text-[9px]" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}>Drag • 1° steps</span>
                  <span>+180°</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setDegrees((d) => Math.max(-180, d - 1))} className="flex-1 rounded-xl border py-2 text-xs font-medium" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}>−1°</button>
                  <button onClick={() => setDegrees((d) => Math.min(180, d + 1))} className="flex-1 rounded-xl border py-2 text-xs font-medium" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}>+1°</button>
                </div>
              </div>
            </ToolCard>

            <ToolCard title="Details" icon={RotateCw} zone="Info">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border p-3" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
                  <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>ORIGINAL</span>
                  <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{imgNatural ? `${imgNatural.w} × ${imgNatural.h}` : "—"}</div>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>pixels</span>
                </div>
                <div className="rounded-xl border p-3" style={{ backgroundColor: degrees === 0 ? "var(--bg-secondary)" : "var(--accent-soft)", borderColor: degrees === 0 ? "var(--border-subtle)" : "var(--accent)" }}>
                  <span className="text-[10px] tracking-widest" style={{ color: degrees === 0 ? "var(--text-muted)" : "var(--accent)" }}>ROTATED</span>
                  <div className="text-sm font-bold" style={{ color: degrees === 0 ? "var(--text-muted)" : "var(--accent)" }}>{newDims ? `${newDims.w} × ${newDims.h}` : "—"}</div>
                  <span className="text-[11px]" style={{ color: degrees === 0 ? "var(--text-muted)" : "var(--accent)" }}>{degrees === 0 ? "same as original" : `${Math.abs(degrees)}° • new bounds`}</span>
                </div>
              </div>
            </ToolCard>

            <div className="flex gap-2">
              <button onClick={() => setDegrees(0)} disabled={degrees === 0} className="flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-medium disabled:opacity-40" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button onClick={handleExport} disabled={degrees === 0} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-40" style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
                <Download className="h-4 w-4" /> Download Rotated
              </button>
            </div>
            <p className="text-center text-[10px]" style={{ color: "var(--text-muted)" }}>Tip: hold <span style={{ color: "var(--text-primary)" }}>Shift</span> while dragging for 15° snap (coming soon)</p>
          </div>
        </div>
      ) : (
        <DropZone onFileSelect={onFileSelect} />
      )}
    </div>
  );
}
