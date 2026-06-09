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
  type LucideIcon,
} from "lucide-react";
import ToolCard from "@/components/ToolCard";
import { getImageInfo, type ImageInfo } from "@/lib/image-utils";
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

export default function InfoTool({ imageFile, previewUrl }: ToolProps) {
  const [info, setInfo] = useState<ImageInfo | null>(null);

  useEffect(() => {
    if (!previewUrl || !imageFile) return undefined;
    let cancelled = false;
    getImageInfo(imageFile, previewUrl).then((data) => {
      if (!cancelled) setInfo(data);
    });
    return () => { cancelled = true; };
  }, [previewUrl, imageFile]);

  const rgbToHex = useCallback((rgb: string): string => {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return rgb;
    return "#" + match.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
  }, []);

  if (!info) {
    return (
      <div className="flex flex-col gap-4">
        <ToolCard title="Image Info" icon={Info} zone="Details">
          <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>
            Upload an image to view its details
          </p>
        </ToolCard>
      </div>
    );
  }

  const fileRows = [
    { icon: FileImage, label: "File Name", value: info.name },
    { icon: Palette, label: "Format", value: info.type },
    { icon: HardDrive, label: "File Size", value: formatBytes(info.size) },
    {
      icon: BarChart3,
      label: "Size Rating",
      value: info.fileSizeCategory.charAt(0).toUpperCase() + info.fileSizeCategory.slice(1),
      color: sizeCategoryColor(info.fileSizeCategory),
    },
    { icon: Calendar, label: "Last Modified", value: formatDate(info.lastModified) },
  ];

  const dimRows = [
    { icon: Maximize, label: "Width", value: `${info.width} px` },
    { icon: Maximize, label: "Height", value: `${info.height} px` },
    { icon: Maximize, label: "Dimensions", value: `${info.width} x ${info.height}` },
    { icon: Hash, label: "Aspect Ratio", value: info.aspectRatio },
    { icon: Hash, label: "Orientation", value: info.orientation.charAt(0).toUpperCase() + info.orientation.slice(1) },
    { icon: Hash, label: "Megapixels", value: `${info.megapixels.toFixed(2)} MP` },
  ];

  const techRows = [
    { icon: Layers, label: "Bits per Pixel", value: `${info.bitsPerPixel} bpp` },
    { icon: HardDrive, label: "Uncompressed RAM", value: formatBytes(info.memoryBytes) },
    { icon: Shield, label: "Alpha Channel", value: info.hasAlpha ? "Yes (transparency)" : "No" },
    { icon: Palette, label: "Color Space", value: info.colorSpace },
    { icon: Sun, label: "Average Brightness", value: `${Math.round(info.averageBrightness * 100)}% - ${brightnessLabel(info.averageBrightness)}` },
  ];

  const renderSection = (
    title: string,
    icon: LucideIcon,
    rows: { icon: LucideIcon; label: string; value: string; color?: string }[]
  ) => (
    <ToolCard title={title} icon={icon} zone="Details">
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-xl px-3 py-2"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
              <div className="flex flex-1 items-center justify-between">
                <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {row.label}
                </span>
                <span
                  className="text-xs font-medium text-right max-w-[55%] truncate"
                  style={{ color: row.color || "var(--text-primary)" }}
                >
                  {row.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ToolCard>
  );

  return (
    <div className="flex flex-col gap-4">
      {renderSection("File Details", FileImage, fileRows)}
      {renderSection("Dimensions", Maximize, dimRows)}
      {renderSection("Technical", Layers, techRows)}

      <ToolCard title="Dominant Colors" icon={Palette} zone="Details">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
            Top 5 most frequent colors
          </p>
          <div className="flex gap-2">
            {info.dominantColors.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="h-10 w-10 rounded-xl border"
                  style={{
                    backgroundColor: color,
                    borderColor: "var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                />
                <span className="text-[8px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {rgbToHex(color)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ToolCard>

      <ToolCard title="Brightness Distribution" icon={Sun} zone="Details">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="relative h-3 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${info.averageBrightness * 100}%`,
                  background: `linear-gradient(90deg, #1a1a2e 0%, #eab308 50%, #fef3c7 100%)`,
                }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-white"
                style={{ left: `${info.averageBrightness * 100}%`, boxShadow: "0 0 4px rgba(255,255,255,0.8)" }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              {Math.round(info.averageBrightness * 100)}%
            </span>
          </div>
          <div className="flex justify-between text-[9px]" style={{ color: "var(--text-muted)" }}>
            <span>Dark</span>
            <span>{brightnessLabel(info.averageBrightness)}</span>
            <span>Bright</span>
          </div>
        </div>
      </ToolCard>

      <ToolCard title="Quick Stats" icon={Info} zone="Details">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Pixels", value: (info.width * info.height).toLocaleString() },
            { label: "Compression", value: `${((1 - info.size / info.memoryBytes) * 100).toFixed(0)}%` },
            { label: "Aspect", value: info.aspectRatio },
            { label: "MP", value: info.megapixels.toFixed(2) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-xl px-3 py-3"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <span className="text-[9px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </span>
              <span className="mt-0.5 text-sm font-semibold" style={{ color: "var(--accent)" }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </ToolCard>
    </div>
  );
}
