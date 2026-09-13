"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Info,
  FileImage,
  Maximize,
  Palette,
  Hash,
  Calendar,
  Layers,
  HardDrive,
  Sun,
  Shield,
  BarChart3,
  Copy,
  Check,
  Eye,
  Image as ImageIcon,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import DropZone from "@/components/DropZone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getImageInfo, type ImageInfo } from "@/lib/image";
import { detailFileName } from "@/lib/format";
import type { ToolProps } from "./RotateTool";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(ts: number): string {
  if (!ts) return "N/A";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function brightnessLabel(b: number): string {
  if (b < 0.2) return "Very Dark";
  if (b < 0.4) return "Dark";
  if (b < 0.6) return "Medium";
  if (b < 0.8) return "Bright";
  return "Very Bright";
}

function sizeCategoryColor(cat: ImageInfo["fileSizeCategory"]): string {
  const map: Record<string, string> = {
    tiny: "#22c55e",
    small: "#3b82f6",
    medium: "#eab308",
    large: "#f97316",
    huge: "#ef4444",
  };
  return map[cat] || "var(--text-muted)";
}

function sizeCategoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function InfoTool({ imageFile, previewUrl, onFileSelect }: ToolProps) {
  const [info, setInfo] = useState<ImageInfo | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl || !imageFile) {
      setInfo(null);
      return undefined;
    }
    let cancelled = false;
    getImageInfo(imageFile, previewUrl).then((data) => {
      if (!cancelled) setInfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, [previewUrl, imageFile]);

  const rgbToHex = useCallback((rgb: string): string => {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return rgb;
    return "#" + match.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
  }, []);

  const handleCopyColor = async (color: string, idx: number) => {
    const hex = rgbToHex(color);
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1400);
    } catch {}
  };

  const handleCopyField = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1200);
    } catch {}
  };

  if (!previewUrl || !imageFile || !info) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <ToolHeader title="Info" subtitle="Complete metadata, palette and technical breakdown — instant, on-device" />
        <DropZone onFileSelect={onFileSelect!} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Eye, title: "Instant analysis", desc: "Dimensions, EXIF, color space" },
            { icon: Palette, title: "Palette", desc: "Top 5 dominant colors" },
            { icon: Sun, title: "Brightness", desc: "Distribution & exposure" },
          ].map((f) => (
            <div
              key={f.title}
              className="flex gap-3 rounded-2xl border p-4"
              style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
              >
                <f.icon className="h-4 w-4" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {f.title}
                </span>
                <span className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {f.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const compression = ((1 - info.size / info.memoryBytes) * 100).toFixed(0);
  const pixels = info.width * info.height;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <ToolHeader title="Info" subtitle="Complete metadata, palette and technical breakdown — instant, on-device" />

      {/* Hero: preview + quick stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Preview card */}
        <div className="overflow-hidden rounded-[20px] border" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={info.name} className="h-full w-full object-contain" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 flex w-full items-end justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white drop-shadow" title={info.name}>
                  {detailFileName(info.name)}
                </p>
                <p className="text-xs text-white/80">
                  {info.width} × {info.height} • {info.type.split("/")[1]?.toUpperCase() || info.type} • {formatBytes(info.size)}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
                style={{ backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.22)" }}
              >
                {sizeCategoryLabel(info.fileSizeCategory)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-secondary)" }}>
            <span className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sizeCategoryColor(info.fileSizeCategory) }} />
              {info.orientation} • {info.aspectRatio} • {(info.megapixels).toFixed(2)} MP
            </span>
            <span className="hidden items-center gap-1.5 sm:flex" style={{ color: "var(--text-muted)" }}>
              <Shield className="h-3 w-3" />
              Local only
            </span>
          </div>
        </div>

        {/* Quick stats 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Pixels", value: pixels.toLocaleString(), sub: `${info.width} × ${info.height}`, icon: Hash },
            { label: "Megapixels", value: info.megapixels.toFixed(2), sub: "MP", icon: Sparkles },
            { label: "Aspect", value: info.aspectRatio, sub: info.orientation, icon: Maximize },
            { label: "Compression", value: `${compression}%`, sub: "saved vs raw", icon: Zap },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col justify-between rounded-2xl border p-4"
              style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                <s.icon className="h-3.5 w-3.5" />
              </span>
              <div className="mt-4 flex flex-col">
                <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {s.label.toUpperCase()}
                </span>
                <span className="mt-1 text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {s.value}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {s.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* Left stack */}
        <div className="flex flex-col gap-4">
          {/* File Details */}
          <div className="rounded-[20px] border p-4 sm:p-5" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                <FileImage className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  File details
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Name, format and storage
                </p>
              </div>
            </div>
            <div className="flex flex-col divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {[
                { icon: FileImage, label: "File name", value: detailFileName(info.name), full: info.name, copy: true },
                { icon: Palette, label: "Format", value: info.type || "unknown", mono: true },
                {
                  icon: HardDrive,
                  label: "File size",
                  value: formatBytes(info.size),
                  badge: sizeCategoryLabel(info.fileSizeCategory),
                  badgeColor: sizeCategoryColor(info.fileSizeCategory),
                },
                { icon: Calendar, label: "Modified", value: formatDate(info.lastModified) },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 py-3">
                  <row.icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="min-w-[90px] text-xs" style={{ color: "var(--text-muted)" }}>
                    {row.label}
                  </span>
                  <span
                    className={`flex-1 truncate text-right text-sm font-medium ${row.mono ? "font-mono text-xs" : ""}`}
                    style={{ color: "var(--text-primary)" }}
                    title={row.full || row.value}
                  >
                    {row.value}
                  </span>
                  {row.badge && (
                    <span className="rounded-full px-2 py-1 text-[10px] font-bold leading-none text-white" style={{ backgroundColor: row.badgeColor }}>
                      {row.badge}
                    </span>
                  )}
                  {row.copy && (
                    <button
                      onClick={() => handleCopyField(row.full || row.value, row.label)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors"
                      style={{
                        backgroundColor: copiedField === row.label ? "var(--accent-soft)" : "var(--bg-secondary)",
                        borderColor: copiedField === row.label ? "var(--accent)" : "var(--border)",
                        color: copiedField === row.label ? "var(--accent)" : "var(--text-muted)",
                      }}
                      title="Copy"
                    >
                      {copiedField === row.label ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="rounded-[20px] border p-4 sm:p-5" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                <Maximize className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Dimensions
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Geometry and resolution
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Width", value: `${info.width.toLocaleString()} px`, icon: Maximize },
                { label: "Height", value: `${info.height.toLocaleString()} px`, icon: Maximize },
                { label: "Dimensions", value: `${info.width} × ${info.height}`, icon: ImageIcon },
                { label: "Aspect ratio", value: info.aspectRatio, icon: Hash },
                { label: "Orientation", value: info.orientation, icon: Eye },
                { label: "Megapixels", value: `${info.megapixels.toFixed(2)} MP`, icon: Sparkles },
              ].map((r) => (
                <div key={r.label} className="flex flex-col rounded-xl px-3 py-3" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                    <r.icon className="h-3 w-3" style={{ color: "var(--accent)" }} />
                    {r.label.toUpperCase()}
                  </span>
                  <span className="mt-1 truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical */}
          <div className="rounded-[20px] border p-4 sm:p-5" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Technical
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Memory and color model
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { icon: Layers, label: "Bits per pixel", value: `${info.bitsPerPixel} bpp` },
                { icon: HardDrive, label: "Raw memory", value: formatBytes(info.memoryBytes) },
                { icon: Shield, label: "Alpha", value: info.hasAlpha ? "Yes — transparency" : "No" },
                { icon: Palette, label: "Color space", value: info.colorSpace },
                { icon: Sun, label: "Brightness", value: `${Math.round(info.averageBrightness * 100)}% — ${brightnessLabel(info.averageBrightness)}` },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
                >
                  <row.icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="min-w-[110px] text-xs" style={{ color: "var(--text-muted)" }}>
                    {row.label}
                  </span>
                  <span className="flex-1 truncate text-right text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right stack */}
        <div className="flex flex-col gap-4">
          {/* Palette */}
          <div className="rounded-[20px] border p-4 sm:p-5" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                <Palette className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Dominant palette
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Tap a swatch to copy HEX
                </p>
              </div>
              <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                5 colors
              </span>
            </div>

            <div className="flex gap-2">
              {info.dominantColors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleCopyColor(c, i)}
                  className="group flex flex-1 flex-col items-center gap-2 rounded-2xl border p-2 transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}
                  title={`Copy ${rgbToHex(c)}`}
                >
                  <span
                    className="h-12 w-full rounded-xl border sm:h-14"
                    style={{ backgroundColor: c, borderColor: "var(--border)" }}
                  />
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold" style={{ color: copiedIdx === i ? "var(--accent)" : "var(--text-muted)" }}>
                    {copiedIdx === i ? <Check className="h-3 w-3" /> : null}
                    {rgbToHex(c).toUpperCase()}
                  </span>
                  <span className="hidden text-[10px] sm:block" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                    {c}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-[11px]" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: info.dominantColors[0] }} />
                Most frequent
              </span>
              <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                {rgbToHex(info.dominantColors[0]).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Brightness */}
          <div className="rounded-[20px] border p-4 sm:p-5" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                <Sun className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Brightness
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {brightnessLabel(info.averageBrightness)} • {Math.round(info.averageBrightness * 100)}%
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative h-3 overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${info.averageBrightness * 100}%`,
                    background: "linear-gradient(90deg, #0f0f1a 0%, #6b7280 35%, #eab308 68%, #fef3c7 100%)",
                  }}
                />
                <div
                  className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white"
                  style={{ left: `calc(${info.averageBrightness * 100}% - 1px)`, boxShadow: "0 0 8px rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.2)" }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                <span>DARK</span>
                <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                  {brightnessLabel(info.averageBrightness).toUpperCase()}
                </span>
                <span>BRIGHT</span>
              </div>
              <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Average luminance sampled from {info.width > 100 || info.height > 100 ? "downscaled" : "full"} image
              </p>
            </div>
          </div>

          {/* Quick stats duplicate compact but with compression visual */}
          <div className="rounded-[20px] border p-4 sm:p-5" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                <BarChart3 className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Efficiency
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                    COMPRESSION SAVED
                  </p>
                  <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--accent)", letterSpacing: "-0.03em" }}>
                    {compression}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Raw {formatBytes(info.memoryBytes)}
                  </p>
                  <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    File {formatBytes(info.size)}
                  </p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                <div className="h-full rounded-full" style={{ width: `${compression}%`, backgroundColor: "var(--accent)" }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { k: "W × H", v: `${info.width}×${info.height}` },
                  { k: "Ratio", v: info.aspectRatio },
                  { k: "BPP", v: `${info.bitsPerPixel}` },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl px-2 py-2" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                    <p className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                      {s.k}
                    </p>
                    <p className="mt-0.5 text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
            <Info className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
            All analysis runs locally — no upload
          </div>
        </div>
      </div>
    </div>
  );
}
