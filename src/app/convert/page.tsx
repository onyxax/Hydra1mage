"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { useImageContext } from "@/lib/image-context";
import ToolLayout from "@/components/shared/ToolLayout";
import ToolCard from "@/components/ToolCard";
import { ExportButton } from "@/components/shared/ExportButton";
import { loadImage, resizeImage, convertImage, downloadBlob, type ConvertFormat } from "@/lib/image-utils";

export default function ConvertPage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  const [format, setFormat] = useState<ConvertFormat>("jpg");
  const [processing, setProcessing] = useState(false);

  const handleExport = async () => {
    if (!previewUrl) return;
    setProcessing(true);
    try {
      const img = await loadImage(previewUrl);
      const canvas = resizeImage(img, img.naturalWidth, img.naturalHeight);
      const blob = await convertImage(canvas, format);
      const name = imageFile?.name.replace(/\.[^.]+$/, `.${format}`) || `converted.${format}`;
      downloadBlob(blob, name);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Convert"
      subtitle={imageFile ? `Converting from ${imageFile.name.split(".").pop()?.toUpperCase()}` : "Upload an image to convert"}
      imageFile={imageFile} previewUrl={previewUrl} onFileSelect={handleFileSelect} onClearImage={handleClearImage}
    >
      <ToolCard title="Output Format" icon={ArrowRightLeft} zone="Conversion">
        <div className="flex flex-col gap-3">
          {([
            { id: "png" as ConvertFormat, name: "PNG", desc: "Lossless, best for logos and transparency", size: "Larger" },
            { id: "jpg" as ConvertFormat, name: "JPG", desc: "Smallest for photos, no transparency", size: "Smallest" },
            { id: "webp" as ConvertFormat, name: "WebP", desc: "Modern format, small size with good quality", size: "Balanced" },
            { id: "avif" as ConvertFormat, name: "AVIF", desc: "Next-gen compression, incredible quality", size: "Tiny" },
            { id: "gif" as ConvertFormat, name: "GIF", desc: "Simple graphics and lightweight images", size: "Medium" },
            { id: "bmp" as ConvertFormat, name: "BMP", desc: "Raw pixels, no compression at all", size: "Very large" },
            { id: "tiff" as ConvertFormat, name: "TIFF", desc: "Professional print and archival quality", size: "Very large" },
            { id: "ico" as ConvertFormat, name: "ICO", desc: "Windows favicon and desktop app icons", size: "Small" },
            { id: "icns" as ConvertFormat, name: "ICNS", desc: "macOS app icons for Apple applications", size: "Small" },
            { id: "svg" as ConvertFormat, name: "SVG", desc: "Vector container, scales to any size", size: "Medium" },
            { id: "pdf" as ConvertFormat, name: "PDF", desc: "Document format, perfect for sharing and print", size: "Medium" },
          ]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className="flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all duration-200"
              style={{
                borderColor: format === f.id ? "var(--accent)" : "var(--border)",
                backgroundColor: format === f.id ? "var(--accent-soft)" : "var(--bg-elevated)",
                boxShadow: format === f.id ? "0 0 0 3px var(--accent-soft)" : "none",
              }}
            >
              <div className="flex flex-col flex-1">
                <span className="text-xs font-semibold" style={{ color: format === f.id ? "var(--accent)" : "var(--text-primary)" }}>
                  {f.name}
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {f.desc}
                </span>
              </div>
              <span className="text-[9px] tracking-wide shrink-0" style={{ color: "var(--text-muted)" }}>
                {f.size}
              </span>
            </button>
          ))}
        </div>
        <div className="divider" />
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
            Source Format
          </span>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {imageFile
              ? `${imageFile.type || "unknown"} (${imageFile.name.split(".").pop()?.toUpperCase()})`
              : "Auto-detected from uploaded file"}
          </p>
        </div>
        {previewUrl && (
          <ExportButton
            onClick={handleExport}
            disabled={processing}
            label={processing ? "Processing..." : `Download as ${format.toUpperCase()}`}
          />
        )}
      </ToolCard>
    </ToolLayout>
  );
}
