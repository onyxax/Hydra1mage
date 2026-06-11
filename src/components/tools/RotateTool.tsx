"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCw } from "lucide-react";
import ToolCard from "@/components/ToolCard";
import CanvasPreview from "@/components/CanvasPreview";
import ToolDropZone from "@/components/shared/ToolDropZone";
import {
  loadImage,
  rotateImage,
  downloadBlob,
  getExtensionFromMime,
} from "@/lib/image-utils";

export interface ToolProps {
  imageFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClearImage: () => void;
}

export default function RotateTool({ imageFile, previewUrl, onFileSelect }: ToolProps) {
  const [degrees, setDegrees] = useState(0);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!previewUrl) return undefined;
    let cancelled = false;
    loadImage(previewUrl)
      .then((img) => {
        if (cancelled) return;
        setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [previewUrl]);

  const drawPreview = useCallback(
    (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const result = rotateImage(img, degrees);
      canvas.width = result.width;
      canvas.height = result.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(result, 0, 0);
    },
    [degrees]
  );

  const presets = [
    { label: "90°", value: 90 },
    { label: "180°", value: 180 },
    { label: "270°", value: 270 },
    { label: "-90°", value: -90 },
  ];

  const handleExport = async () => {
    if (!previewUrl) return;
    const img = await loadImage(previewUrl);
    const canvas = rotateImage(img, degrees);
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = getExtensionFromMime(blob.type);
        const name = imageFile?.name.replace(/\.[^.]+$/, `_rotated.${ext}`) || `rotated.${ext}`;
        downloadBlob(blob, name);
      }
    }, "image/png");
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div>
        <h1
          className="text-2xl font-light tracking-tight sm:text-3xl"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
        >
          Rotate
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Rotate your image to any angle
        </p>
      </div>

      {previewUrl ? (
        <>
          <CanvasPreview previewUrl={previewUrl} draw={drawPreview} />
          <ToolCard title="Rotation" icon={RotateCw} zone="Transform">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {presets.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setDegrees(p.value)}
                    className="flex-1 rounded-xl border px-2 py-2.5 text-[10px] font-medium transition-all duration-200"
                    style={{
                      borderColor: degrees === p.value ? "var(--accent)" : "var(--border)",
                      backgroundColor: degrees === p.value ? "var(--accent-soft)" : "transparent",
                      color: degrees === p.value ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Custom Angle
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                    {degrees}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={degrees}
                  onChange={(e) => setDegrees(Number(e.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full"
                  style={{ backgroundColor: "var(--border)" }}
                />
              </div>
              {imgNatural && (
                <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "var(--bg-secondary)" }}>
                  <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Original: {imgNatural.w} x {imgNatural.h} px
                  </span>
                </div>
              )}
              <button onClick={handleExport} className="btn-primary flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Download Rotated
              </button>
            </div>
          </ToolCard>
        </>
      ) : (
        <ToolDropZone onFileSelect={onFileSelect} />
      )}
    </div>
  );
}
