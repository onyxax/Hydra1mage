"use client";

import { useState } from "react";
import { FileDown, Download, Sparkles } from "lucide-react";
import { useImageContext } from "@/lib/image-context";
import ToolLayout from "@/components/shared/ToolLayout";
import ToolCard from "@/components/ToolCard";
import { Slider } from "@/components/shared/Slider";
import { formatFileSize } from "@/components/shared/ImagePreview";
import {
  loadImage,
  resizeImage,
  compressImage,
  smartCompress,
  quantizeColors,
  downloadBlob,
} from "@/lib/image-utils";

export default function CompressPage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  const [outputType, setOutputType] = useState<"png" | "webp" | "jpg">("jpg");
  const [quality, setQuality] = useState(80);
  const [colors, setColors] = useState(256);
  const [targetKB, setTargetKB] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ size: number; savings: number; format: string } | null>(null);

  const originalSize = imageFile?.size ?? 0;
  const inputType = imageFile?.type || "";
  const isPNG = inputType === "image/png" || imageFile?.name.toLowerCase().endsWith(".png");

  const outputFormat: "image/png" | "image/webp" | "image/jpeg" = outputType === "png" ? "image/png" : outputType === "webp" ? "image/webp" : "image/jpeg";
  const isLossy = outputType !== "png";

  const formatOptions = isPNG
    ? [
        { id: "png" as const, label: "PNG", desc: "Lossless, keep transparency" },
        { id: "webp" as const, label: "WebP Lossless", desc: "Smaller than PNG, keeps transparency" },
        { id: "jpg" as const, label: "JPG", desc: "Smallest size, NO transparency" },
      ]
    : [
        { id: "jpg" as const, label: "JPG", desc: "Universal, good for photos" },
        { id: "webp" as const, label: "WebP", desc: "30% smaller than JPG" },
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
      if (outputType === "png" && colors < 256) {
        finalCanvas = quantizeColors(canvas, colors);
      }
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

  return (
    <ToolLayout
      title="Smart Compress"
      subtitle={originalSize ? `${formatFileSize(originalSize)} original` : "Upload an image to compress"}
      imageFile={imageFile} previewUrl={previewUrl} onFileSelect={handleFileSelect} onClearImage={handleClearImage}
    >
      <ToolCard title="Output Format" icon={FileDown} zone="Format">
        <div className="flex flex-col gap-2">
          {formatOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => setOutputType(f.id)}
              className="flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-all duration-200"
              style={{
                borderColor: outputType === f.id ? "var(--accent)" : "var(--border)",
                backgroundColor: outputType === f.id ? "var(--accent-soft)" : "var(--bg-elevated)",
              }}
            >
              <div className="flex flex-col">
                <span className="text-xs font-medium" style={{ color: outputType === f.id ? "var(--accent)" : "var(--text-primary)" }}>
                  {f.label}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{f.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {outputType === "png" && (
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                Color Palette
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                {colors} colors
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={256}
              step={8}
              value={colors}
              onChange={(e) => setColors(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full"
              style={{ backgroundColor: "var(--border)" }}
            />
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Fewer colors = smaller file. 256 = no change, 64 = big savings.
            </span>
          </div>
        )}

        {outputType === "jpg" && isPNG && (
          <div
            className="mt-3 rounded-xl px-3 py-2 text-[10px]"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
          >
            JPG does not support transparency -- transparent areas will become black
          </div>
        )}
      </ToolCard>

      <ToolCard title="Smart Optimize" icon={Sparkles} zone="Auto">
        <div className="flex flex-col gap-3">
          {isLossy && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                Target Size (KB) - optional
              </span>
              <input
                type="text"
                value={targetKB}
                onChange={(e) => setTargetKB(e.target.value.replace(/\D/g, ""))}
                className="input-bar py-3 text-xs"
                placeholder="Leave empty for auto"
              />
            </div>
          )}
          <button
            onClick={handleSmartCompress}
            disabled={!previewUrl || processing}
            className="btn-primary flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {processing ? "Analyzing..." : "Smart Compress"}
          </button>
          {result && (
            <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "var(--bg-secondary)" }}>
              {result.savings > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                      Compressed to
                    </span>
                    <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                      {formatFileSize(result.size)} ({result.format})
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                      Savings
                    </span>
                    <span className="text-xs font-medium" style={{ color: result.savings > 50 ? "#22c55e" : "var(--accent)" }}>
                      {result.savings}% smaller
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Already optimized -- original is smaller. Original will be downloaded.
                </span>
              )}
            </div>
          )}
        </div>
      </ToolCard>

      {isLossy && (
        <ToolCard title="Manual Quality" icon={FileDown} zone="Fine-tune">
          <Slider label="Quality" value={quality} onChange={setQuality} min={1} max={100} />
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
              Estimated Output
            </span>
            <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              {originalSize ? `~${formatFileSize(Math.round(estimatedBytes))}` : "--"}
            </span>
          </div>
          {previewUrl && (
            <button onClick={handleExport} disabled={processing} className="btn-primary flex items-center gap-2">
              <Download className="h-4 w-4" />
              {processing ? "Processing..." : `Download as ${outputType.toUpperCase()}`}
            </button>
          )}
        </ToolCard>
      )}

      {!isLossy && previewUrl && (
        <button
          onClick={handleExport}
          disabled={processing}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {processing ? "Processing..." : `Download as ${outputType.toUpperCase()}`}
        </button>
      )}
    </ToolLayout>
  );
}
