"use client";

import { useState } from "react";
import { FileDown, Download, Sparkles, Zap, Image as ImageIcon, Gauge, ArrowRight } from "lucide-react";
import { useImageContext } from "@/lib/image-context";
import ToolLayout from "@/components/shared/ToolLayout";
import ToolCard from "@/components/ToolCard";
import { Slider } from "@/components/shared/Slider";
import { formatFileSize } from "@/components/shared/ImagePreview";
import { loadImage, resizeImage, compressImage, smartCompress, quantizeColors, downloadBlob } from "@/lib/image";

export default function CompressPage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  const [outputType, setOutputType] = useState<"png" | "webp" | "jpg">("jpg");
  const [quality, setQuality] = useState(80);
  const [colors, setColors] = useState(256);
  const [targetKB, setTargetKB] = useState("");
  const [activeTab, setActiveTab] = useState<"smart" | "manual">("smart");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ size: number; savings: number; format: string } | null>(null);

  const originalSize = imageFile?.size ?? 0;
  const inputType = imageFile?.type || "";
  const isPNG = inputType === "image/png" || imageFile?.name.toLowerCase().endsWith(".png");

  const outputFormat: "image/png" | "image/webp" | "image/jpeg" =
    outputType === "png" ? "image/png" : outputType === "webp" ? "image/webp" : "image/jpeg";
  const isLossy = outputType !== "png";

  const formatOptions = isPNG
    ? [
        { id: "png" as const, label: "PNG", desc: "Keep transparency", badge: "Lossless", icon: "◈" },
        { id: "webp" as const, label: "WebP", desc: "Smaller, keeps transparency", badge: "-30%", icon: "⬢" },
        { id: "jpg" as const, label: "JPG", desc: "Smallest, no transparency", badge: "-60%", icon: "⬣" },
      ]
    : [
        { id: "jpg" as const, label: "JPG", desc: "Universal", badge: "Default", icon: "⬣" },
        { id: "webp" as const, label: "WebP", desc: "30% smaller", badge: "Recommended", icon: "⬢" },
      ];

  const handleSmartCompress = async () => {
    if (!previewUrl) return;
    setProcessing(true);
    setResult(null);
    try {
      const img = await loadImage(previewUrl);
      const canvas = resizeImage(img, img.naturalWidth, img.naturalHeight);
      const targetBytes = targetKB ? Number(targetKB) * 1024 : undefined;
      const res = await smartCompress(canvas, originalSize, outputFormat, targetBytes, imageFile || undefined, isPNG && outputType === "png" ? colors : undefined);
      setResult({ size: res.compressedSize, savings: res.savings, format: outputType.toUpperCase() });
      if (isLossy) setQuality(res.quality);
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!previewUrl) return;
    setProcessing(true);
    try {
      const img = await loadImage(previewUrl);
      const canvas = resizeImage(img, img.naturalWidth, img.naturalHeight);
      let finalCanvas = canvas;
      if (outputType === "png" && colors < 256) finalCanvas = quantizeColors(canvas, colors);
      const blob = await compressImage(finalCanvas, isLossy ? quality : 100, outputFormat);
      if (outputType === "png" && imageFile && blob.size >= originalSize) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(imageFile);
        a.download = imageFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } else {
        const ext = outputType === "webp" ? "webp" : outputType === "png" ? "png" : "jpg";
        const name = imageFile?.name.replace(/\.[^.]+$/, `_compressed.${ext}`) || `compressed.${ext}`;
        downloadBlob(blob, name);
      }
    } finally {
      setProcessing(false);
    }
  };

  const estimatedBytes = isLossy ? (originalSize * quality) / 100 : originalSize;
  const savingsPreview = originalSize ? Math.max(0, Math.round(((originalSize - estimatedBytes) / originalSize) * 100)) : 0;

  return (
    <ToolLayout
      title="Smart Compress"
      subtitle={originalSize ? `${formatFileSize(originalSize)} • ${imageFile?.name.split(".").pop()?.toUpperCase()} • Auto-optimize` : "Upload an image to compress — AI finds the best size/quality trade-off"}
      imageFile={imageFile}
      previewUrl={previewUrl}
      onFileSelect={handleFileSelect}
      onClearImage={handleClearImage}
    >
      {/* — Output Format — visual segmented control */}
      <ToolCard title="Output Format" icon={ImageIcon} zone="Format">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {formatOptions.map((f) => {
            const active = outputType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setOutputType(f.id)}
                className="group relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-all duration-200 hover:scale-[1.01]"
                style={{
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  backgroundColor: active ? "var(--accent-soft)" : "var(--bg-elevated)",
                  boxShadow: active ? "0 0 0 2px var(--accent-soft)" : "none",
                }}
              >
                <span className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide" style={{ backgroundColor: active ? "var(--accent)" : "var(--bg-secondary)", color: active ? "white" : "var(--text-muted)" }}>
                  {f.badge}
                </span>
                <span className="text-[11px]" style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}>
                  {f.icon}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                    {f.label}
                  </span>
                  <span className="text-[10px] leading-snug" style={{ color: "var(--text-muted)" }}>
                    {f.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {outputType === "png" && (
          <div className="mt-3 rounded-xl border p-3" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                PALETTE • {colors} colors
              </span>
              <span className="text-[10px] rounded-full px-2 py-0.5" style={{ backgroundColor: colors < 128 ? "rgba(34,197,94,0.12)" : "var(--bg-elevated)", color: colors < 128 ? "#16a34a" : "var(--text-muted)", border: "1px solid var(--border)" }}>
                {colors === 256 ? "Lossless" : `${Math.round(((256 - colors) / 256) * 100)}% smaller`}
              </span>
            </div>
            <input type="range" min={8} max={256} step={8} value={colors} onChange={(e) => setColors(Number(e.target.value))} className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full" style={{ backgroundColor: "var(--border)" }} />
            <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
              <span>8 (tiny)</span>
              <span>64 (balanced)</span>
              <span>256 (full)</span>
            </div>
          </div>
        )}

        {outputType === "jpg" && isPNG && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px]" style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.12)", color: "#b91c1c" }}>
            <span className="mt-0.5">⚠</span>
            <span>JPG discards transparency — transparent pixels will become black. Use PNG or WebP to keep it.</span>
          </div>
        )}
      </ToolCard>

      {/* — Unified Smart / Manual — */}
      <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex gap-1 p-1" style={{ backgroundColor: "var(--bg-secondary)" }}>
          {[
            { id: "smart" as const, label: "Smart", icon: Sparkles, desc: "Auto" },
            { id: "manual" as const, label: "Manual", icon: Gauge, desc: "Fine-tune" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all"
              style={{
                backgroundColor: activeTab === t.id ? "var(--bg-elevated)" : "transparent",
                color: activeTab === t.id ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: activeTab === t.id ? "var(--shadow-sm)" : "none",
                border: activeTab === t.id ? "1px solid var(--border)" : "1px solid transparent",
              }}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              <span className="hidden text-[10px] opacity-60 sm:inline">• {t.desc}</span>
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === "smart" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  TARGET SIZE (OPTIONAL)
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={targetKB}
                      onChange={(e) => setTargetKB(e.target.value.replace(/\D/g, ""))}
                      placeholder="Auto"
                      className="w-full rounded-xl border px-3 py-2.5 pr-8 text-sm outline-none transition-all"
                      style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-muted)" }}>
                      KB
                    </span>
                  </div>
                  <div className="hidden gap-1 sm:flex">
                    {[100, 300, 500].map((v) => (
                      <button
                        key={v}
                        onClick={() => setTargetKB(String(v))}
                        className="rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors"
                        style={{ backgroundColor: targetKB === String(v) ? "var(--accent-soft)" : "var(--bg-secondary)", borderColor: targetKB === String(v) ? "var(--accent)" : "var(--border)", color: targetKB === String(v) ? "var(--accent)" : "var(--text-muted)" }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Leave empty for AI to pick the best quality/size balance.
                </span>
              </div>

              <button onClick={handleSmartCompress} disabled={!previewUrl || processing} className="btn-primary flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                {processing ? "Analyzing…" : "Smart Compress"}
                {!processing && <ArrowRight className="h-3.5 w-3.5 opacity-60" />}
              </button>

              {result && (
                <div className="relative overflow-hidden rounded-xl border p-4" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--bg-elevated)", border: "3px solid var(--border)" }}>
                      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(var(--accent) ${result.savings}%, var(--border) 0)` }} />
                      <div className="absolute inset-[4px] rounded-full" style={{ backgroundColor: "var(--bg-elevated)" }} />
                      <span className="relative text-xs font-bold" style={{ color: result.savings > 50 ? "#16a34a" : "var(--accent)" }}>
                        -{result.savings}%
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {formatFileSize(result.size)} • {result.format}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        from {formatFileSize(originalSize)} • {result.savings}% smaller
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: result.savings > 50 ? "#16a34a" : "var(--text-muted)" }}>
                        {result.savings > 50 ? "Excellent compression" : result.savings > 25 ? "Good savings" : "Already optimized"}
                      </span>
                    </div>
                  </div>
                  {result.savings === 0 && <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>Original is smaller — it will be downloaded instead.</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {isLossy ? (
                <>
                  <Slider label="Quality" value={quality} onChange={setQuality} min={1} max={100} />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border px-3 py-2" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
                      <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                        ESTIMATED
                      </span>
                      <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                        ~{originalSize ? formatFileSize(Math.round(estimatedBytes)) : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border px-3 py-2" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
                      <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                        SAVINGS
                      </span>
                      <div className="text-sm font-bold" style={{ color: savingsPreview > 50 ? "#16a34a" : "var(--text-primary)" }}>
                        -{savingsPreview}%
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${quality}%`, backgroundColor: quality > 75 ? "#16a34a" : quality > 50 ? "var(--accent)" : "#eab308" }} />
                  </div>
                  <button onClick={handleExport} disabled={processing} className="btn-primary flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    {processing ? "Processing…" : `Download as ${outputType.toUpperCase()}`}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    PNG is lossless — use the palette slider above to reduce size, or switch to WebP for better compression with transparency.
                  </p>
                  <button onClick={handleExport} disabled={processing} className="btn-primary flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    {processing ? "Processing…" : `Download as ${outputType.toUpperCase()}`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick tip */}
      <div className="flex items-start gap-2 rounded-xl border px-3 py-2" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Pro tip:</span> For photos use JPG/WebP, for logos with transparency use PNG/WebP. Smart mode picks the best quality automatically — manual is for pixel-perfect control.
        </p>
      </div>
    </ToolLayout>
  );
}
