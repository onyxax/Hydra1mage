"use client";

import { useState, useCallback } from "react";
import { Sun, Thermometer, Sparkles } from "lucide-react";
import ToolCard from "@/components/ToolCard";
import CanvasPreview from "@/components/CanvasPreview";
import ToolDropZone from "@/components/shared/ToolDropZone";
import {
  loadImage,
  adjustImageAdvanced,
  downloadBlob,
  getExtensionFromMime,
  type AdjustOptions,
} from "@/lib/image-utils";
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

function Slider({
  label,
  value,
  onChange,
  min = -100,
  max = 100,
  resetValue = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  resetValue?: number;
}) {
  const isDefault = value === resetValue;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-medium tabular-nums"
            style={{ color: isDefault ? "var(--text-muted)" : "var(--accent)" }}
          >
            {value > 0 ? `+${value}` : value}
          </span>
          {!isDefault && (
            <button
              onClick={() => onChange(resetValue)}
              className="text-[9px] underline"
              style={{ color: "var(--text-muted)" }}
            >
              reset
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full"
          style={{ backgroundColor: "var(--border)" }}
        />
        {min < 0 && (
          <div
            className="pointer-events-none absolute top-1/2 h-2 w-px -translate-y-1/2"
            style={{ left: "50%", backgroundColor: "var(--text-muted)", opacity: 0.3 }}
          />
        )}
      </div>
    </div>
  );
}

export default function AdjustTool({ imageFile, previewUrl, onFileSelect }: ToolProps) {
  const [opts, setOpts] = useState<AdjustOptions>(DEFAULTS);

  const set = useCallback(
    <K extends keyof AdjustOptions>(key: K, val: AdjustOptions[K]) =>
      setOpts((p) => ({ ...p, [key]: val })),
    []
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
        const result = adjustImageAdvanced(tmpImg, opts);
        canvas.width = result.width;
        canvas.height = result.height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(result, 0, 0);
      };
      tmpImg.src = tmp.toDataURL("image/png");
    },
    [opts]
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

  const hasChanges = Object.keys(DEFAULTS).some(
    (k) => opts[k as keyof AdjustOptions] !== DEFAULTS[k as keyof AdjustOptions]
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div>
        <h1
          className="text-2xl font-light tracking-tight sm:text-3xl"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
        >
          Adjust
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Fine-tune exposure, color, and detail
        </p>
      </div>

      {previewUrl ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-4">
            <CanvasPreview previewUrl={previewUrl} draw={drawPreview} />
          </div>

          <div className="flex flex-col gap-4">
            <ToolCard title="Light" icon={Sun} zone="Adjustments">
              <div className="flex flex-col gap-4">
                <Slider label="Exposure" value={opts.exposure} onChange={(v) => set("exposure", v)} min={-100} max={100} />
                <Slider label="Highlights" value={opts.highlights} onChange={(v) => set("highlights", v)} min={-100} max={100} />
                <Slider label="Shadows" value={opts.shadows} onChange={(v) => set("shadows", v)} min={-100} max={100} />
                <Slider label="Gamma" value={opts.gamma} onChange={(v) => set("gamma", v)} min={-100} max={100} />
              </div>
            </ToolCard>

            <ToolCard title="Color" icon={Thermometer} zone="Adjustments">
              <div className="flex flex-col gap-4">
                <Slider label="Temperature" value={opts.temperature} onChange={(v) => set("temperature", v)} min={-100} max={100} />
                <Slider label="Tint" value={opts.tint} onChange={(v) => set("tint", v)} min={-100} max={100} />
                <Slider label="Vibrance" value={opts.vibrance} onChange={(v) => set("vibrance", v)} min={-100} max={100} />
              </div>
            </ToolCard>

            <ToolCard title="Detail" icon={Sparkles} zone="Adjustments">
              <div className="flex flex-col gap-4">
                <Slider label="Sharpness" value={opts.sharpness} onChange={(v) => set("sharpness", v)} min={0} max={100} />
              </div>
            </ToolCard>

            {hasChanges && (
              <button onClick={() => setOpts(DEFAULTS)} className="btn-ghost text-xs">
                Reset All
              </button>
            )}

            <button onClick={handleExport} className="btn-primary flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Download Adjusted
            </button>
          </div>
        </div>
      ) : (
        <ToolDropZone onFileSelect={onFileSelect} />
      )}
    </div>
  );
}
