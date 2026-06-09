"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Crop, Download, Upload } from "lucide-react";
import { useImageContext } from "@/lib/image-context";
import CropEditor, { type CropEditorHandle } from "@/components/CropEditor";
import { InputField } from "@/components/shared/InputField";
import { loadImage, downloadBlob, getExtensionFromMime } from "@/lib/image-utils";

const PRESETS = ["Free", "1:1", "4:3", "16:9"] as const;
const PRESET_RATIOS: Record<string, number> = {
  Free: NaN,
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
};

export default function CropPage() {
  const { imageFile, previewUrl, handleFileSelect } = useImageContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropEditorRef = useRef<CropEditorHandle>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState("");
  const [cropH, setCropH] = useState("");
  const [preset, setPreset] = useState("Free");
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!previewUrl) return undefined;
    let cancelled = false;
    loadImage(previewUrl)
      .then((img) => {
        if (cancelled) return;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        setImgNatural({ w, h });
        setCropX(0);
        setCropY(0);
        setCropW(String(w));
        setCropH(String(h));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [previewUrl]);

  const handleCropChange = (x: number, y: number, w: number, h: number) => {
    setCropX(x);
    setCropY(y);
    setCropW(String(w));
    setCropH(String(h));
    setPreset("Free");
  };

  const handlePreset = (p: string) => {
    setPreset(p);
    if (!imgNatural) return;
    const { w, h } = imgNatural;
    switch (p) {
      case "1:1": {
        const s = Math.min(w, h);
        const x = Math.round((w - s) / 2);
        const y = Math.round((h - s) / 2);
        setCropX(x); setCropY(y);
        setCropW(String(s)); setCropH(String(s));
        break;
      }
      case "4:3": {
        const ratio = 4 / 3;
        let cw = w, ch = Math.round(w / ratio);
        if (ch > h) { ch = h; cw = Math.round(h * ratio); }
        const x = Math.round((w - cw) / 2);
        const y = Math.round((h - ch) / 2);
        setCropX(x); setCropY(y);
        setCropW(String(cw)); setCropH(String(ch));
        break;
      }
      case "16:9": {
        const ratio = 16 / 9;
        let cw = w, ch = Math.round(w / ratio);
        if (ch > h) { ch = h; cw = Math.round(h * ratio); }
        const x = Math.round((w - cw) / 2);
        const y = Math.round((h - ch) / 2);
        setCropX(x); setCropY(y);
        setCropW(String(cw)); setCropH(String(ch));
        break;
      }
      default:
        setCropX(0); setCropY(0);
        setCropW(String(w)); setCropH(String(h));
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleExport = () => {
    const canvas = cropEditorRef.current?.getCroppedCanvas();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = getExtensionFromMime(blob.type);
        const name = imageFile?.name.replace(/\.[^.]+$/, `_cropped.${ext}`) || `cropped.${ext}`;
        downloadBlob(blob, name);
      }
    }, "image/png");
  };

  const aspectRatio = PRESET_RATIOS[preset] ?? NaN;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-3xl font-light tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
        >
          Crop
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {imgNatural ? `${imgNatural.w} \u00d7 ${imgNatural.h} px` : "Upload an image to crop"}
        </p>
      </div>

      {previewUrl && imgNatural ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <div className="flex items-stretch justify-center">
            <div className="w-full">
              <CropEditor
                ref={cropEditorRef}
                src={previewUrl}
                naturalWidth={imgNatural.w}
                naturalHeight={imgNatural.h}
                cropX={cropX}
                cropY={cropY}
                cropW={Number(cropW) || imgNatural.w}
                cropH={Number(cropH) || imgNatural.h}
                aspectRatio={aspectRatio}
                onChange={handleCropChange}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl border p-5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="mb-4 flex items-center gap-2">
                <Crop className="h-4 w-4" style={{ color: "var(--accent)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  Presets
                </span>
              </div>
              <div className="flex gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePreset(p)}
                    className="flex-1 rounded-xl border px-2 py-2.5 text-[10px] font-medium transition-all duration-200"
                    style={{
                      borderColor: preset === p ? "var(--accent)" : "var(--border)",
                      backgroundColor: preset === p ? "var(--accent-soft)" : "transparent",
                      color: preset === p ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  Dimensions
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="X" value={String(cropX)} onChange={(v) => setCropX(Number(v) || 0)} unit="px" />
                <InputField label="Y" value={String(cropY)} onChange={(v) => setCropY(Number(v) || 0)} unit="px" />
                <InputField label="Width" value={cropW} onChange={setCropW} unit="px" />
                <InputField label="Height" value={cropH} onChange={setCropH} unit="px" />
              </div>
            </div>

            <button
              onClick={handleExport}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Cropped
            </button>
          </div>
        </div>
      ) : (
        <div
          className="group flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-16 transition-colors duration-200 cursor-pointer"
          style={{
            borderColor: isDragOver ? "var(--accent)" : "var(--border)",
            backgroundColor: isDragOver ? "var(--accent-soft)" : "transparent",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={(e) => {
            if (!isDragOver) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragOver) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }
          }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--accent-soft)" }}
          >
            <Upload className="h-6 w-6" style={{ color: "var(--accent)" }} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Drop your image here
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              or click to browse files
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["PNG", "JPG", "WebP", "HEIC", "GIF", "SVG", "BMP", "TIFF", "AVIF"].map((fmt) => (
              <span key={fmt} className="rounded-md border px-2 py-1 text-[10px] font-medium" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                {fmt}
              </span>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      )}
    </div>
  );
}
