"use client";

import { useState, useEffect, useRef } from "react";
import { Crop, Download, Maximize, Image as ImageIcon, Sparkles, RotateCcw } from "lucide-react";
import { useImageContext } from "@/lib/image-context";
import CropEditor, { type CropEditorHandle } from "@/components/CropEditor";
import DropZone from "@/components/DropZone";
import { InputField } from "@/components/shared/InputField";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { useImageDimensions } from "@/hooks/useImageLoader";
import { downloadBlob, getExtensionFromMime } from "@/lib/image";
import ToolCard from "@/components/ToolCard";

const PRESETS = [
  { id: "Free", label: "Free", desc: "Any", icon: "◯" },
  { id: "1:1", label: "1:1", desc: "Square", icon: "■" },
  { id: "4:3", label: "4:3", desc: "Standard", icon: "▭" },
  { id: "16:9", label: "16:9", desc: "Widescreen", icon: "▬" },
  { id: "9:16", label: "9:16", desc: "Story", icon: "▯" },
] as const;

const PRESET_RATIOS: Record<string, number> = {
  Free: NaN,
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

export default function CropPage() {
  const { imageFile, previewUrl, handleFileSelect } = useImageContext();
  const cropEditorRef = useRef<CropEditorHandle>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState("");
  const [cropH, setCropH] = useState("");
  const [preset, setPreset] = useState("Free");
  const dims = useImageDimensions(previewUrl);
  const imgNatural = dims;

  useEffect(() => {
    if (!dims) return;
    const { w, h } = dims;
    setCropX(0);
    setCropY(0);
    setCropW(String(w));
    setCropH(String(h));
  }, [dims]);

  const handleCropChange = (x: number, y: number, w: number, h: number) => {
    setCropX(x);
    setCropY(y);
    setCropW(String(w));
    setCropH(String(h));
    setPreset("Free");
  };

  const handlePreset = (p: string) => {
    setPreset(p);
    if (!imgNatural) return;
    const { w, h } = imgNatural;
    if (p === "Free") {
      setCropX(0); setCropY(0); setCropW(String(w)); setCropH(String(h));
      return;
    }
    const ratio = PRESET_RATIOS[p];
    let cw = w, ch = Math.round(w / ratio);
    if (ch > h) { ch = h; cw = Math.round(h * ratio); }
    const x = Math.round((w - cw) / 2);
    const y = Math.round((h - ch) / 2);
    setCropX(x); setCropY(y);
    setCropW(String(cw)); setCropH(String(ch));
  };

  const handleExport = () => {
    const canvas = cropEditorRef.current?.getCroppedCanvas();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = getExtensionFromMime(blob.type);
        const name = imageFile?.name.replace(/\.[^.]+$/, `_cropped-${cropW}x${cropH}.${ext}`) || `cropped-${cropW}x${cropH}.${ext}`;
        downloadBlob(blob, name);
      }
    }, "image/png");
  };

  const aspectRatio = PRESET_RATIOS[preset] ?? NaN;
  const cropArea = (Number(cropW) || 0) * (Number(cropH) || 0);
  const origArea = imgNatural ? imgNatural.w * imgNatural.h : 0;
  const cropPercent = origArea ? Math.round((cropArea / origArea) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <ToolHeader title="Crop" subtitle={imgNatural ? `${imgNatural.w} × ${imgNatural.h} → ${cropW} × ${cropH} px • ${cropPercent}% of original` : "Upload an image to crop — precise or preset"} />

      {previewUrl && imgNatural ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <span className="flex items-center gap-2 text-[11px] font-medium tracking-widest" style={{ color: "var(--text-muted)" }}>
                  <Crop className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                  EDITOR
                </span>
                <span className="hidden items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium sm:flex" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                  Drag to adjust • Scroll to zoom
                </span>
              </div>
              <CropEditor
                ref={cropEditorRef}
                src={previewUrl}
                naturalWidth={imgNatural.w}
                naturalHeight={imgNatural.h}
                cropX={cropX}
                cropY={cropY}
                cropW={Number(cropW) || imgNatural.w}
                cropH={Number(cropH) || imgNatural.h}
                aspectRatio={aspectRatio}
                onChange={handleCropChange}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
              <span className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5" />
                {imgNatural.w} × {imgNatural.h} → {cropW} × {cropH}
              </span>
              <span className="hidden text-[11px] sm:inline" style={{ color: cropPercent < 50 ? "#eab308" : "var(--accent)" }}>
                {cropPercent}% kept
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <ToolCard title="Aspect ratio" icon={Maximize} zone="Crop">
              <div className="grid grid-cols-5 gap-1.5">
                {PRESETS.map((p) => {
                  const active = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePreset(p.id)}
                      className="flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: active ? "var(--accent)" : "var(--bg-elevated)",
                        borderColor: active ? "var(--accent)" : "var(--border)",
                        color: active ? "white" : "var(--text-muted)",
                        boxShadow: active ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: active ? "white" : "var(--text-primary)" }}>{p.icon}</span>
                      <span className="text-[11px] font-bold" style={{ color: active ? "white" : "var(--text-primary)" }}>{p.label}</span>
                      <span className="hidden text-[9px] sm:block" style={{ color: active ? "rgba(255,255,255,0.8)" : "var(--text-muted)" }}>{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </ToolCard>

            <ToolCard title="Crop area" icon={Crop} zone="Precise">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="X" value={String(cropX)} onChange={(v) => setCropX(Number(v) || 0)} unit="px" />
                <InputField label="Y" value={String(cropY)} onChange={(v) => setCropY(Number(v) || 0)} unit="px" />
                <InputField label="Width" value={cropW} onChange={setCropW} unit="px" />
                <InputField label="Height" value={cropH} onChange={setCropH} unit="px" />
              </div>
              <div className="rounded-xl border p-3" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span style={{ color: "var(--text-muted)" }}>Output</span>
                  <span className="font-bold" style={{ color: "var(--accent)" }}>{cropW} × {cropH} px</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span style={{ color: "var(--text-muted)" }}>Ratio</span>
                  <span style={{ color: "var(--text-primary)" }}>{preset === "Free" ? "Free" : preset} • {cropPercent}%</span>
                </div>
              </div>
            </ToolCard>

            <div className="flex gap-2">
              <button onClick={() => handlePreset("Free")} className="flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-medium" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button onClick={handleExport} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white" style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
                <Download className="h-4 w-4" /> Download {cropW}×{cropH}
              </button>
            </div>
            <p className="text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
              Tip: drag the corners to resize • drag inside to move • use presets for social media
            </p>
          </div>
        </div>
      ) : (
        <DropZone onFileSelect={handleFileSelect} />
      )}
    </div>
  );
}
