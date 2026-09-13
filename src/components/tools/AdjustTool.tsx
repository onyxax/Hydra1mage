"use client";

import { useState, useCallback } from "react";
import { Sun, Thermometer, Sparkles, Wand2, RotateCcw, Download, Eye, EyeOff } from "lucide-react";
import ToolCard from "@/components/ToolCard";
import CanvasPreview from "@/components/CanvasPreview";
import DropZone from "@/components/DropZone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { loadImage, adjustImageAdvanced, downloadBlob, getExtensionFromMime, type AdjustOptions } from "@/lib/image";
import type { ToolProps } from "./RotateTool";

const DEFAULTS: AdjustOptions = {
  exposure: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  vibrance: 0,
  gamma: 0,
  sharpness: 0,
};

const PRESETS: Array<{ label: string; desc: string; values: Partial<AdjustOptions> }> = [
  { label: "Natural", desc: "Balanced", values: { exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, vibrance: 0, gamma: 0, sharpness: 0 } },
  { label: "Bright", desc: "Airy", values: { exposure: 18, highlights: -20, shadows: 15, gamma: 8, vibrance: 10 } },
  { label: "Warm", desc: "Cozy", values: { temperature: 22, tint: 6, vibrance: 12, exposure: 5 } },
  { label: "Cool", desc: "Crisp", values: { temperature: -18, tint: -6, vibrance: -5, sharpness: 15 } },
  { label: "Vivid", desc: "Pop", values: { vibrance: 35, shadows: 10, highlights: -10, sharpness: 20, gamma: -5 } },
  { label: "Dramatic", desc: "Moody", values: { exposure: -8, highlights: -35, shadows: -15, gamma: -12, vibrance: -10, sharpness: 10 } },
];

function Slider({
  label,
  value,
  onChange,
  min = -100,
  max = 100,
  resetValue = 0,
  track,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  resetValue?: number;
  track?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const isDefault = value === resetValue;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="min-w-[32px] text-right text-[11px] font-bold tabular-nums" style={{ color: isDefault ? "var(--text-muted)" : "var(--accent)" }}>
            {value > 0 ? `+${value}` : value}
          </span>
          {!isDefault && (
            <button onClick={() => onChange(resetValue)} className="rounded-full border px-1.5 py-0.5 text-[9px] font-medium" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" }}>
              reset
            </button>
          )}
        </div>
      </div>
      <div className="relative h-1.5">
        <div className="absolute inset-0 rounded-full" style={{ background: track ?? "var(--border)" }} />
        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isDefault ? "var(--border)" : "var(--accent)", opacity: isDefault ? 0.5 : 1 }} />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow"
        />
        {min < 0 && <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: "var(--bg-elevated)", opacity: 0.9 }} />}
      </div>
    </div>
  );
}

export default function AdjustTool({ imageFile, previewUrl, onFileSelect }: ToolProps) {
  const [opts, setOpts] = useState<AdjustOptions>(DEFAULTS);
  const [showOriginal, setShowOriginal] = useState(false);
  const [activePreset, setActivePreset] = useState("Natural");

  const set = useCallback(<K extends keyof AdjustOptions>(key: K, val: AdjustOptions[K]) => setOpts((p) => ({ ...p, [key]: val })), []);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setActivePreset(preset.label);
    setOpts((prev) => ({ ...DEFAULTS, ...preset.values } as AdjustOptions));
  };

  const drawPreview = useCallback(
    (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      // When showOriginal is true, draw original without adjustments for comparison
      if (showOriginal) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        return;
      }
      const result = adjustImageAdvanced(img, opts);
      canvas.width = result.width;
      canvas.height = result.height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(result, 0, 0);
    },
    [opts, showOriginal]
  );

  const handleExport = async () => {
    if (!previewUrl) return;
    const img = await loadImage(previewUrl);
    const canvas = adjustImageAdvanced(img, opts);
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = getExtensionFromMime(blob.type);
        const name = imageFile?.name.replace(/\.[^.]+$/, `_adjusted.${ext}`) || `adjusted.${ext}`;
        downloadBlob(blob, name);
      }
    }, "image/png");
  };

  const hasChanges = PRESETS[0].label !== activePreset || Object.keys(DEFAULTS).some((k) => opts[k as keyof AdjustOptions] !== DEFAULTS[k as keyof AdjustOptions]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <ToolHeader title="Adjust" subtitle="Fine-tune light, color, and detail — live preview" />

      {previewUrl ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-3">
            <CanvasPreview previewUrl={previewUrl} draw={drawPreview} />
            <div className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
              <span className="flex items-center gap-2 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hasChanges ? "var(--accent)" : "var(--text-muted)", opacity: hasChanges ? 1 : 0.4 }} />
                {hasChanges ? `${activePreset} • edited` : "Original"}
              </span>
              <button
                onClick={() => setShowOriginal((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
                style={{ backgroundColor: showOriginal ? "var(--accent-soft)" : "var(--bg-secondary)", borderColor: showOriginal ? "var(--accent)" : "var(--border)", color: showOriginal ? "var(--accent)" : "var(--text-muted)" }}
              >
                {showOriginal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showOriginal ? "Showing original" : "Hold to compare"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Presets */}
            <ToolCard title="Presets" icon={Wand2} zone="Quick">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">
                {PRESETS.map((p) => {
                  const active = activePreset === p.label;
                  return (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className="flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: active ? "var(--accent-soft)" : "var(--bg-elevated)",
                        borderColor: active ? "var(--accent)" : "var(--border)",
                        color: active ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      <span className="text-[11px] font-bold" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                        {p.label}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {p.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ToolCard>

            <ToolCard title="Light" icon={Sun} zone="Adjust">
              <div className="flex flex-col gap-4">
                <Slider label="Exposure" value={opts.exposure} onChange={(v) => { set("exposure", v); setActivePreset("Custom"); }} track="linear-gradient(90deg, #1a1a1a 0%, #f5f5f5 100%)" />
                <Slider label="Highlights" value={opts.highlights} onChange={(v) => { set("highlights", v); setActivePreset("Custom"); }} track="linear-gradient(90deg, #fff 0%, #a3a3a3 100%)" />
                <Slider label="Shadows" value={opts.shadows} onChange={(v) => { set("shadows", v); setActivePreset("Custom"); }} track="linear-gradient(90deg, #171717 0%, #e5e5e5 100%)" />
                <Slider label="Gamma" value={opts.gamma} onChange={(v) => { set("gamma", v); setActivePreset("Custom"); }} />
              </div>
            </ToolCard>

            <ToolCard title="Color" icon={Thermometer} zone="Adjust">
              <div className="flex flex-col gap-4">
                <Slider label="Temperature" value={opts.temperature} onChange={(v) => { set("temperature", v); setActivePreset("Custom"); }} track="linear-gradient(90deg, #60a5fa 0%, #f97316 100%)" />
                <Slider label="Tint" value={opts.tint} onChange={(v) => { set("tint", v); setActivePreset("Custom"); }} track="linear-gradient(90deg, #4ade80 0%, #f472b6 100%)" />
                <Slider label="Vibrance" value={opts.vibrance} onChange={(v) => { set("vibrance", v); setActivePreset("Custom"); }} track="linear-gradient(90deg, #a3a3a3 0%, #f43f5e 100%)" />
              </div>
            </ToolCard>

            <ToolCard title="Detail" icon={Sparkles} zone="Adjust">
              <Slider label="Sharpness" value={opts.sharpness} onChange={(v) => { set("sharpness", v); setActivePreset("Custom"); }} min={0} max={100} track="linear-gradient(90deg, #e5e7eb 0%, #1f2937 100%)" />
            </ToolCard>

            <div className="flex gap-2">
              <button onClick={() => { setOpts(DEFAULTS); setActivePreset("Natural"); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-colors" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button onClick={handleExport} className="flex flex-[2] items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white transition-all hover:scale-[1.01]" style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
                <Download className="h-4 w-4" />
                Download Adjusted
              </button>
            </div>

            <p className="text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
              Drag sliders • Hold <span style={{ color: "var(--text-primary)" }}>Showing original</span> to compare • Works offline
            </p>
          </div>
        </div>
      ) : (
        <DropZone onFileSelect={onFileSelect} />
      )}
    </div>
  );
}
