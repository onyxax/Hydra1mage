"use client";

import { useState, useEffect, useRef } from "react";
import { Maximize, Lock, Unlock, Sparkles, Download, RotateCcw, Image as ImageIcon, ArrowRightLeft } from "lucide-react";
import { useImageContext } from "@/lib/image-context";
import ToolLayout from "@/components/shared/ToolLayout";
import ToolCard from "@/components/ToolCard";
import { InputField } from "@/components/shared/InputField";
import { useImageDimensions } from "@/hooks/useImageLoader";
import { loadImage, resizeImage, downloadBlob, getExtensionFromMime } from "@/lib/image";

const PRESETS = [
  { label: "25%", scale: 0.25 },
  { label: "50%", scale: 0.5 },
  { label: "75%", scale: 0.75 },
  { label: "150%", scale: 1.5 },
  { label: "2×", scale: 2 },
];

const COMMON_SIZES = [
  { label: "512px", w: 512 },
  { label: "1024px", w: 1024 },
  { label: "1920px", w: 1920 },
];

export default function ResizePage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  const [resizeW, setResizeW] = useState("");
  const [resizeH, setResizeH] = useState("");
  const [aspectLocked, setAspectLocked] = useState(true);
  const [scale, setScale] = useState(100);
  const imgNatural = useImageDimensions(previewUrl);
  const aspectRef = useRef(1);

  useEffect(() => {
    if (!imgNatural) return;
    const { w, h } = imgNatural;
    setResizeW(String(w));
    setResizeH(String(h));
    setScale(100);
    aspectRef.current = w / h;
  }, [imgNatural]);

  const handleWChange = (v: string) => {
    setResizeW(v);
    if (aspectLocked && imgNatural) {
      const num = Number(v);
      if (num > 0) setResizeH(String(Math.round(num / aspectRef.current)));
    }
    if (imgNatural) {
      const num = Number(v);
      if (num > 0) setScale(Math.round((num / imgNatural.w) * 100));
    }
  };

  const handleHChange = (v: string) => {
    setResizeH(v);
    if (aspectLocked && imgNatural) {
      const num = Number(v);
      if (num > 0) setResizeW(String(Math.round(num * aspectRef.current)));
    }
    if (imgNatural) {
      const num = Number(v);
      if (num > 0) setScale(Math.round((num / imgNatural.h) * 100));
    }
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    if (!imgNatural) return;
    const w = Math.round((imgNatural.w * newScale) / 100);
    const h = Math.round((imgNatural.h * newScale) / 100);
    setResizeW(String(w));
    setResizeH(String(h));
  };

  const handlePreset = (s: number) => {
    if (!imgNatural) return;
    const w = Math.round(imgNatural.w * s);
    const h = Math.round(imgNatural.h * s);
    setResizeW(String(w));
    setResizeH(String(h));
    setScale(Math.round(s * 100));
  };

  const handleExport = async () => {
    if (!previewUrl) return;
    const img = await loadImage(previewUrl);
    const tw = Number(resizeW) || img.naturalWidth;
    const th = Number(resizeH) || img.naturalHeight;
    const canvas = resizeImage(img, tw, th);
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = getExtensionFromMime(blob.type);
        const name = imageFile?.name.replace(/\.[^.]+$/, `_resized-${tw}x${th}.${ext}`) || `resized-${tw}x${th}.${ext}`;
        downloadBlob(blob, name);
      }
    }, "image/png");
  };

  const newPixels = (() => {
    const w = Number(resizeW) || 0, h = Number(resizeH) || 0;
    return w * h;
  })();
  const origPixels = imgNatural ? imgNatural.w * imgNatural.h : 0;
  const pixelChange = origPixels ? Math.round(((newPixels - origPixels) / origPixels) * 100) : 0;

  return (
    <ToolLayout
      title="Resize"
      subtitle={imgNatural ? `${imgNatural.w} × ${imgNatural.h} → ${resizeW} × ${resizeH} px • ${scale}%` : "Upload an image to resize — precise or preset"}
      imageFile={imageFile}
      previewUrl={previewUrl}
      onFileSelect={handleFileSelect}
      onClearImage={handleClearImage}
    >
      <ToolCard title="Dimensions" icon={Maximize} zone="Resize">
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Width" value={resizeW} onChange={handleWChange} unit="px" />
          <InputField label="Height" value={resizeH} onChange={handleHChange} unit="px" />
        </div>

        <button
          onClick={() => setAspectLocked((l) => !l)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-medium transition-all"
          style={{
            backgroundColor: aspectLocked ? "var(--accent-soft)" : "var(--bg-secondary)",
            borderColor: aspectLocked ? "var(--accent)" : "var(--border)",
            color: aspectLocked ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {aspectLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          {aspectLocked ? "Aspect locked" : "Free aspect"}
          <span className="hidden text-[10px] opacity-60 sm:inline">• {aspectLocked ? "proportional" : "stretch"}</span>
        </button>

        <div className="rounded-xl border p-3" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>SCALE</span>
            <span className="rounded-full border px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: scale === 100 ? "var(--bg-elevated)" : "var(--accent-soft)", borderColor: scale === 100 ? "var(--border)" : "var(--accent)", color: scale === 100 ? "var(--text-muted)" : "var(--accent)" }}>
              {scale}%
            </span>
          </div>
          <input type="range" min={10} max={300} value={scale} onChange={(e) => handleScaleChange(Number(e.target.value))} className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow" style={{ backgroundColor: "var(--border)" }} />
          <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span>10%</span>
            <span>100% (original)</span>
            <span>300%</span>
          </div>
        </div>
      </ToolCard>

      <ToolCard title="Quick presets" icon={Sparkles} zone="Presets">
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.scale)}
              className="rounded-xl border py-2 text-xs font-bold transition-colors"
              style={{
                backgroundColor: scale === Math.round(p.scale * 100) ? "var(--accent)" : "var(--bg-elevated)",
                borderColor: scale === Math.round(p.scale * 100) ? "var(--accent)" : "var(--border)",
                color: scale === Math.round(p.scale * 100) ? "white" : "var(--text-muted)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {COMMON_SIZES.map((s) => (
            <button
              key={s.label}
              onClick={() => handlePreset(s.w / (imgNatural?.w ?? s.w))}
              className="flex-1 rounded-xl border py-2 text-[11px] font-medium"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              {s.label} wide
            </button>
          ))}
        </div>
      </ToolCard>

      <ToolCard title="Output" icon={ImageIcon} zone="Info">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border p-3 text-center" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
            <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>ORIGINAL</span>
            <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{imgNatural ? `${imgNatural.w} × ${imgNatural.h}` : "—"}</div>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{origPixels ? `${(origPixels / 1e6).toFixed(2)} MP` : ""}</span>
          </div>
          <div className="rounded-xl border p-3 text-center" style={{ backgroundColor: scale === 100 ? "var(--bg-secondary)" : "var(--accent-soft)", borderColor: scale === 100 ? "var(--border-subtle)" : "var(--accent)" }}>
            <span className="text-[10px] tracking-widest" style={{ color: scale === 100 ? "var(--text-muted)" : "var(--accent)" }}>NEW</span>
            <div className="text-sm font-bold" style={{ color: scale === 100 ? "var(--text-muted)" : "var(--accent)" }}>{resizeW && resizeH ? `${resizeW} × ${resizeH}` : "—"}</div>
            <span className="text-[11px]" style={{ color: scale === 100 ? "var(--text-muted)" : "var(--accent)" }}>{pixelChange === 0 ? "same" : `${pixelChange > 0 ? "+" : ""}${pixelChange}% pixels`}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
          <ArrowRightLeft className="h-3 w-3" />
          {imgNatural ? `${imgNatural.w} × ${imgNatural.h} → ${resizeW} × ${resizeH}` : "Set dimensions above"}
        </div>
      </ToolCard>

      <div className="flex gap-2">
        <button onClick={() => { if (imgNatural) { setResizeW(String(imgNatural.w)); setResizeH(String(imgNatural.h)); setScale(100); } }} className="flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-medium" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <button onClick={handleExport} disabled={!previewUrl || !resizeW || !resizeH} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-40" style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
          <Download className="h-4 w-4" /> Download {resizeW}×{resizeH}
        </button>
      </div>
    </ToolLayout>
  );
}
