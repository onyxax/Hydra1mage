"use client";

import { useState, useCallback, useMemo } from "react";
import { Sparkles, Waves, Paintbrush, Eye, Palette, Grid3X3, Sun, Search, SlidersHorizontal, Download, Wand2, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ToolCard from "@/components/ToolCard";
import CanvasPreview from "@/components/CanvasPreview";
import DropZone from "@/components/DropZone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  loadImage,
  blurImage,
  grayscaleImage,
  sepiaImage,
  invertImage,
  pixelateImage,
  sharpenImage,
  embossImage,
  noiseImage,
  vignetteImage,
  thresholdImage,
  duotoneImage,
  posterizeImage,
  edgeDetectImage,
  oilPaintImage,
  downloadBlob,
  getExtensionFromMime,
} from "@/lib/image";
import type { ToolProps } from "./RotateTool";

type EffectId = "blur" | "grayscale" | "sepia" | "invert" | "pixelate" | "sharpen" | "emboss" | "noise" | "vignette" | "threshold" | "duotone" | "posterize" | "edges" | "oilpaint";

interface EffectMeta {
  id: EffectId;
  label: string;
  desc: string;
  icon: LucideIcon;
  category: "distort" | "style" | "color" | "detail";
  hasSlider?: boolean;
  sliderLabel?: string;
  sliderMin?: number;
  sliderMax?: number;
  sliderDefault?: number;
  gradient?: string;
}

const EFFECTS: EffectMeta[] = [
  { id: "blur", label: "Blur", desc: "Soften", icon: Waves, category: "distort", hasSlider: true, sliderLabel: "Radius", sliderMin: 1, sliderMax: 20, sliderDefault: 4, gradient: "linear-gradient(90deg, #e0f2fe 0%, #bae6fd 100%)" },
  { id: "pixelate", label: "Pixelate", desc: "Mosaic", icon: Grid3X3, category: "distort", hasSlider: true, sliderLabel: "Block", sliderMin: 2, sliderMax: 30, sliderDefault: 8, gradient: "linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)" },
  { id: "noise", label: "Noise", desc: "Grain", icon: Waves, category: "distort", hasSlider: true, sliderLabel: "Intensity", sliderMin: 1, sliderMax: 100, sliderDefault: 30 },
  { id: "sharpen", label: "Sharpen", desc: "Crisp", icon: Eye, category: "detail", hasSlider: true, sliderLabel: "Amount", sliderMin: 1, sliderMax: 100, sliderDefault: 50, gradient: "linear-gradient(90deg, #e5e7eb 0%, #1f2937 100%)" },
  { id: "emboss", label: "Emboss", desc: "3D", icon: Sun, category: "detail" },
  { id: "edges", label: "Edges", desc: "Outline", icon: Eye, category: "detail" },
  { id: "grayscale", label: "Grayscale", desc: "Mono", icon: Palette, category: "color" },
  { id: "sepia", label: "Sepia", desc: "Vintage", icon: Paintbrush, category: "color" },
  { id: "invert", label: "Invert", desc: "Negative", icon: Eye, category: "color" },
  { id: "threshold", label: "Threshold", desc: "B&W", icon: Grid3X3, category: "color", hasSlider: true, sliderLabel: "Level", sliderMin: 1, sliderMax: 99, sliderDefault: 50 },
  { id: "duotone", label: "Duotone", desc: "Duo tone", icon: Palette, category: "color" },
  { id: "vignette", label: "Vignette", desc: "Fade", icon: Sun, category: "style", hasSlider: true, sliderLabel: "Strength", sliderMin: 1, sliderMax: 100, sliderDefault: 50 },
  { id: "posterize", label: "Posterize", desc: "Flat", icon: Paintbrush, category: "style", hasSlider: true, sliderLabel: "Levels", sliderMin: 2, sliderMax: 10, sliderDefault: 4 },
  { id: "oilpaint", label: "Oil Paint", desc: "Artistic", icon: Paintbrush, category: "style", hasSlider: true, sliderLabel: "Brush", sliderMin: 1, sliderMax: 10, sliderDefault: 4 },
];

const CATEGORIES: Array<{ id: "all" | EffectMeta["category"]; label: string; icon: LucideIcon }> = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "distort", label: "Distort", icon: Waves },
  { id: "style", label: "Style", icon: Paintbrush },
  { id: "color", label: "Color", icon: Palette },
  { id: "detail", label: "Detail", icon: Eye },
];

export default function EffectsTool({ imageFile, previewUrl, onFileSelect }: ToolProps) {
  const [activeEffect, setActiveEffect] = useState<EffectId>("blur");
  const [activeCat, setActiveCat] = useState<"all" | EffectMeta["category"]>("all");
  const [query, setQuery] = useState("");
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [duoColor1, setDuoColor1] = useState("#0B3D0B");
  const [duoColor2, setDuoColor2] = useState("#FF6B35");
  const [showOriginal, setShowOriginal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const getSlider = useCallback((id: EffectId) => {
    const eff = EFFECTS.find((e) => e.id === id);
    if (!eff?.hasSlider) return 0;
    return sliderValues[id] ?? eff.sliderDefault ?? 50;
  }, [sliderValues]);

  const setSlider = (id: EffectId, val: number) => setSliderValues((p) => ({ ...p, [id]: val }));

  const filtered = useMemo(() => {
    let list = activeCat === "all" ? EFFECTS : EFFECTS.filter((e) => e.category === activeCat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => e.label.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q));
    }
    return list;
  }, [activeCat, query]);

  const runEffect = useCallback(
    (img: HTMLImageElement): HTMLCanvasElement => {
      if (showOriginal) {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        return c;
      }
      switch (activeEffect) {
        case "blur": return blurImage(img, getSlider("blur"));
        case "pixelate": return pixelateImage(img, getSlider("pixelate"));
        case "sharpen": return sharpenImage(img, getSlider("sharpen"));
        case "emboss": return embossImage(img);
        case "noise": return noiseImage(img, getSlider("noise"));
        case "vignette": return vignetteImage(img, getSlider("vignette"));
        case "grayscale": return grayscaleImage(img);
        case "sepia": return sepiaImage(img);
        case "invert": return invertImage(img);
        case "threshold": return thresholdImage(img, getSlider("threshold"));
        case "duotone": return duotoneImage(img, duoColor1, duoColor2);
        case "posterize": return posterizeImage(img, getSlider("posterize"));
        case "edges": return edgeDetectImage(img);
        case "oilpaint": return oilPaintImage(img, getSlider("oilpaint"));
      }
    },
    [activeEffect, getSlider, duoColor1, duoColor2, showOriginal]
  );

  const drawPreview = useCallback(
    (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const result = runEffect(img);
      canvas.width = result.width;
      canvas.height = result.height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(result, 0, 0);
    },
    [runEffect]
  );

  const handleExport = async () => {
    if (!previewUrl) return;
    setProcessing(true);
    try {
      const img = await loadImage(previewUrl);
      const canvas = runEffect(img);
      canvas.toBlob((blob) => {
        if (blob) {
          const ext = getExtensionFromMime(blob.type);
          const name = imageFile?.name.replace(/\.[^.]+$/, `_${activeEffect}.${ext}`) || `${activeEffect}.${ext}`;
          downloadBlob(blob, name);
        }
      }, "image/png");
    } finally {
      setProcessing(false);
    }
  };

  const activeMeta = EFFECTS.find((e) => e.id === activeEffect)!;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <ToolHeader title="Effects" subtitle="15 artistic filters — instant preview, fine-tune" />

      {previewUrl ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-3">
            <CanvasPreview previewUrl={previewUrl} draw={drawPreview} />
            <div className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
              <span className="flex items-center gap-2 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: showOriginal ? "var(--text-muted)" : "var(--accent)" }} />
                {activeMeta.label} • {activeMeta.desc}
              </span>
              <button onClick={() => setShowOriginal((v) => !v)} className="rounded-lg border px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: showOriginal ? "var(--accent-soft)" : "var(--bg-secondary)", borderColor: showOriginal ? "var(--accent)" : "var(--border)", color: showOriginal ? "var(--accent)" : "var(--text-muted)" }}>
                {showOriginal ? "Showing original" : "Hold to compare"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search effects — blur, vintage..." className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const active = activeCat === cat.id;
                return (
                  <button key={cat.id} onClick={() => setActiveCat(cat.id)} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors" style={{ backgroundColor: active ? "var(--accent)" : "var(--bg-elevated)", borderColor: active ? "var(--accent)" : "var(--border)", color: active ? "white" : "var(--text-muted)" }}>
                    <cat.icon className="h-3 w-3" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Effects grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
              {filtered.map((e) => {
                const Icon = e.icon;
                const isActive = activeEffect === e.id;
                return (
                  <button key={e.id} onClick={() => setActiveEffect(e.id)} className="group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all hover:scale-[1.02]" style={{ backgroundColor: isActive ? "var(--accent-soft)" : "var(--bg-elevated)", borderColor: isActive ? "var(--accent)" : "var(--border)", boxShadow: isActive ? "0 0 0 2px var(--accent-soft)" : "none" }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: isActive ? "var(--accent)" : "var(--bg-secondary)", color: isActive ? "white" : "var(--text-muted)" }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-semibold leading-none" style={{ color: isActive ? "var(--accent)" : "var(--text-primary)" }}>{e.label}</span>
                    <span className="hidden text-[10px] leading-none sm:block" style={{ color: "var(--text-muted)" }}>{e.desc}</span>
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>No effects match “{query}”</p>}

            {/* Active controls */}
            <ToolCard title={activeMeta.label} icon={activeMeta.icon} zone={activeMeta.category}>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{activeMeta.desc} — {activeMeta.hasSlider ? "drag to fine-tune" : "one-click"}</p>
              {activeMeta.hasSlider && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>{activeMeta.sliderLabel}</span>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--accent)" }}>{getSlider(activeEffect)}</span>
                  </div>
                  <div className="relative h-1.5">
                    <div className="absolute inset-0 rounded-full" style={{ background: activeMeta.gradient ?? "var(--border)" }} />
                    <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${((getSlider(activeEffect) - (activeMeta.sliderMin ?? 0)) / ((activeMeta.sliderMax ?? 100) - (activeMeta.sliderMin ?? 0))) * 100}%`, backgroundColor: "var(--accent)" }} />
                    <input type="range" min={activeMeta.sliderMin} max={activeMeta.sliderMax} value={getSlider(activeEffect)} onChange={(e) => setSlider(activeEffect, Number(e.target.value))} className="absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow" />
                  </div>
                </div>
              )}
              {activeEffect === "duotone" && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>SHADOW</span>
                      <input type="color" value={duoColor1} onChange={(e) => setDuoColor1(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border" style={{ borderColor: "var(--border)" }} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>HIGHLIGHT</span>
                      <input type="color" value={duoColor2} onChange={(e) => setDuoColor2(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border" style={{ borderColor: "var(--border)" }} />
                    </label>
                  </div>
                  <div className="h-2 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${duoColor1}, ${duoColor2})` }} />
                </div>
              )}
            </ToolCard>

            <div className="flex gap-2">
              <button onClick={() => { setSliderValues({}); setDuoColor1("#0B3D0B"); setDuoColor2("#FF6B35"); }} className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button onClick={handleExport} disabled={processing} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white" style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
                <Download className="h-4 w-4" /> {processing ? "Processing…" : `Download ${activeMeta.label}`}
              </button>
            </div>
            <p className="text-center text-[10px]" style={{ color: "var(--text-muted)" }}>Hold <span style={{ color: "var(--text-primary)" }}>Showing original</span> to compare • All filters run offline</p>
          </div>
        </div>
      ) : (
        <DropZone onFileSelect={onFileSelect} />
      )}
    </div>
  );
}
