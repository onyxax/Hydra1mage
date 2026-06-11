"use client";

import { useState, useCallback } from "react";
import { ArrowDownLeft, ArrowRight, ArrowDown } from "lucide-react";
import ToolCard from "@/components/ToolCard";
import CanvasPreview from "@/components/CanvasPreview";
import ToolDropZone from "@/components/shared/ToolDropZone";
import {
  loadImage,
  flipImage,
  downloadBlob,
  getExtensionFromMime,
} from "@/lib/image-utils";
import type { ToolProps } from "./RotateTool";

export default function FlipTool({ imageFile, previewUrl, onFileSelect }: ToolProps) {
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const drawPreview = useCallback(
    (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const result = flipImage(img, flipH, flipV);
      canvas.width = result.width;
      canvas.height = result.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(result, 0, 0);
    },
    [flipH, flipV]
  );

  const handleExport = async () => {
    if (!previewUrl) return;
    const img = await loadImage(previewUrl);
    const canvas = flipImage(img, flipH, flipV);
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = getExtensionFromMime(blob.type);
        const suffix = flipH && flipV ? "flipped-both" : flipH ? "flipped-h" : "flipped-v";
        const name = imageFile?.name.replace(/\.[^.]+$/, `_${suffix}.${ext}`) || `${suffix}.${ext}`;
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
          Flip
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Flip your image horizontally or vertically
        </p>
      </div>

      {previewUrl ? (
        <>
          <CanvasPreview previewUrl={previewUrl} draw={drawPreview} />
          <ToolCard title="Flip Image" icon={ArrowDownLeft} zone="Transform">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setFlipH((h) => !h)}
                  className="flex-1 rounded-xl border px-3 py-2.5 text-[10px] font-medium transition-all duration-200"
                  style={{
                    borderColor: flipH ? "var(--accent)" : "var(--border)",
                    backgroundColor: flipH ? "var(--accent-soft)" : "transparent",
                    color: flipH ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  <ArrowRight className="h-3.5 w-3.5 inline mr-1.5" />
                  Horizontal
                </button>
                <button
                  onClick={() => setFlipV((v) => !v)}
                  className="flex-1 rounded-xl border px-3 py-2.5 text-[10px] font-medium transition-all duration-200"
                  style={{
                    borderColor: flipV ? "var(--accent)" : "var(--border)",
                    backgroundColor: flipV ? "var(--accent-soft)" : "transparent",
                    color: flipV ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  <ArrowDown className="h-3.5 w-3.5 inline mr-1.5" />
                  Vertical
                </button>
              </div>
              <div
                className="rounded-xl px-3 py-2 text-center text-[10px]"
                style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" }}
              >
                {flipH && flipV
                  ? "Flipping horizontally and vertically"
                  : flipH
                  ? "Flipping horizontally"
                  : flipV
                  ? "Flipping vertically"
                  : "Select a flip direction"}
              </div>
              <button onClick={handleExport} className="btn-primary flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4" />
                Download Flipped
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
