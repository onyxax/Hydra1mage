"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  Waves,
  Paintbrush,
  Eye,
  Palette,
  Grid3X3,
  Sun,
  type LucideIcon,
} from "lucide-react";
import ToolCard from "@/components/ToolCard";
import CanvasPreview from "@/components/CanvasPreview";
import ToolDropZone from "@/components/shared/ToolDropZone";
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
} from "@/lib/image-utils";
import type { ToolProps } from "./RotateTool";

type EffectId =
  | "blur" | "grayscale" | "sepia" | "invert"
  | "pixelate" | "sharpen" | "emboss" | "noise"
  | "vignette" | "threshold" | "duotone" | "posterize"
  | "edges" | "oilpaint";

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
}

const EFFECTS: EffectMeta[] = [
  { id: "blur", label: "Blur", desc: "Soften details", icon: Waves, category: "distort", hasSlider: true, sliderLabel: "Radius", sliderMin: 1, sliderMax: 20, sliderDefault: 4 },
  { id: "pixelate", label: "Pixelate", desc: "Mosaic blocks", icon: Grid3X3, category: "distort", hasSlider: true, sliderLabel: "Block Size", sliderMin: 2, sliderMax: 30, sliderDefault: 8 },
  { id: "sharpen", label: "Sharpen", desc: "Enhance edges", icon: Eye, category: "detail", hasSlider: true, sliderLabel: "Amount", sliderMin: 1, sliderMax: 100, sliderDefault: 50 },
  { id: "emboss", label: "Emboss", desc: "3D raised effect", icon: Sun, category: "detail" },
  { id: "noise", label: "Noise", desc: "Add film grain", icon: Waves, category: "distort", hasSlider: true, sliderLabel: "Intensity", sliderMin: 1, sliderMax: 100, sliderDefault: 30 },
  { id: "vignette", label: "Vignette", desc: "Darken corners", icon: Sun, category: "style", hasSlider: true, sliderLabel: "Strength", sliderMin: 1, sliderMax: 100, sliderDefault: 50 },
  { id: "grayscale", label: "Grayscale", desc: "Remove all color", icon: Palette, category: "color" },
  { id: "sepia", label: "Sepia", desc: "Vintage warm tone", icon: Paintbrush, category: "color" },
  { id: "invert", label: "Invert", desc: "Reverse colors", icon: Eye, category: "color" },
  { id: "threshold", label: "Threshold", desc: "Pure black & white", icon: Grid3X3, category: "color", hasSlider: true, sliderLabel: "Level", sliderMin: 1, sliderMax: 99, sliderDefault: 50 },
  { id: "duotone", label: "Duotone", desc: "Two-color映射", icon: Palette, category: "color" },
  { id: "posterize", label: "Posterize", desc: "Reduce color levels", icon: Paintbrush, category: "style", hasSlider: true, sliderLabel: "Levels", sliderMin: 2, sliderMax: 10, sliderDefault: 4 },
  { id: "edges", label: "Edge Detect", desc: "Find outlines", icon: Eye, category: "detail" },
  { id: "oilpaint", label: "Oil Paint", desc: "Painterly effect", icon: Paintbrush, category: "style", hasSlider: true, sliderLabel: "Brush Size", sliderMin: 1, sliderMax: 10, sliderDefault: 4 },
];

const CATEGORIES = [
  { id: "distort" as const, label: "Distort", icon: Waves },
  { id: "style" as const, label: "Style", icon: Paintbrush },
  { id: "color" as const, label: "Color", icon: Palette },
  { id: "detail" as const, label: "Detail", icon: Eye },
];

export default function EffectsTool({ imageFile, previewUrl, onFileSelect }: ToolProps) {
  const [activeEffect, setActiveEffect] = useState<EffectId>("blur");
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [duoColor1, setDuoColor1] = useState("#0B3D0B");
  const [duoColor2, setDuoColor2] = useState("#FF6B35");
  const [processing, setProcessing] = useState(false);

  const getSlider = useCallback((id: EffectId) => {
    const eff = EFFECTS.find((e) => e.id === id);
    if (!eff?.hasSlider) return 0;
    return sliderValues[id] ?? eff.sliderDefault ?? 50;
  }, [sliderValues]);

  const setSlider = (id: EffectId, val: number) =>
    setSliderValues((p) => ({ ...p, [id]: val }));

  const runEffect = useCallback(
    (img: HTMLImageElement): HTMLCanvasElement => {
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
    [activeEffect, getSlider, duoColor1, duoColor2]
  );

  const drawPreview = useCallback(
    (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const tmp = document.createElement("canvas");
      tmp.width = w;
      tmp.height = h;
      const tmpCtx = tmp.getContext("2d")!;
      tmpCtx.drawImage(img, 0, 0, w, h);

      const tmpImg = new Image();
      tmpImg.onload = () => {
        const result = runEffect(tmpImg);
        canvas.width = result.width;
        canvas.height = result.height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(result, 0, 0);
      };
      tmpImg.src = tmp.toDataURL("image/png");
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

  const activeMeta = EFFECTS.find((e) => e.id === activeEffect);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-light tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
          Effects
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Transform your image with artistic filters
        </p>
      </div>

      {previewUrl ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-4">
            <CanvasPreview previewUrl={previewUrl} draw={drawPreview} />
          </div>

          <div className="flex flex-col gap-4">
            {CATEGORIES.map((cat) => {
              const catEffects = EFFECTS.filter((e) => e.category === cat.id);
              const CatIcon = cat.icon;
              return (
                <ToolCard key={cat.id} title={cat.label} icon={CatIcon} zone="Effects">
                  <div className="grid grid-cols-2 gap-1.5">
                    {catEffects.map((e) => {
                      const Icon = e.icon;
                      const isActive = activeEffect === e.id;
                      return (
                        <button
                          key={e.id}
                          onClick={() => setActiveEffect(e.id)}
                          className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200"
                          style={{
                            borderColor: isActive ? "var(--accent)" : "var(--border)",
                            backgroundColor: isActive ? "var(--accent-soft)" : "var(--bg-elevated)",
                          }}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }} />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium" style={{ color: isActive ? "var(--accent)" : "var(--text-primary)" }}>
                              {e.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ToolCard>
              );
            })}

            {activeMeta?.hasSlider && (
              <ToolCard title={activeMeta.label} icon={activeMeta.icon} zone="Settings">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                      {activeMeta.sliderLabel}
                    </span>
                    <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                      {getSlider(activeEffect)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={activeMeta.sliderMin}
                    max={activeMeta.sliderMax}
                    value={getSlider(activeEffect)}
                    onChange={(e) => setSlider(activeEffect, Number(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                </div>
              </ToolCard>
            )}

            {activeEffect === "duotone" && (
              <ToolCard title="Duotone Colors" icon={Palette} zone="Settings">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] tracking-widest" style={{ color: "var(--text-muted)" }}>Shadow</span>
                      <input
                        type="color"
                        value={duoColor1}
                        onChange={(e) => setDuoColor1(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded-lg border"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                    <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] tracking-widest" style={{ color: "var(--text-muted)" }}>Highlight</span>
                      <input
                        type="color"
                        value={duoColor2}
                        onChange={(e) => setDuoColor2(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded-lg border"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                  </div>
                  <div
                    className="h-3 w-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${duoColor1}, ${duoColor2})` }}
                  />
                </div>
              </ToolCard>
            )}

            {activeMeta?.desc && (
              <div className="rounded-xl px-4 py-3 text-[10px]" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                {activeMeta.desc}
              </div>
            )}

            <button onClick={handleExport} disabled={processing} className="btn-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {processing ? "Processing..." : `Download ${activeMeta?.label || activeEffect}`}
            </button>
          </div>
        </div>
      ) : (
        <ToolDropZone onFileSelect={onFileSelect} />
      )}
    </div>
  );
}
