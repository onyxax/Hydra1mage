"use client";

import { useRef, useEffect } from "react";
import { loadImage } from "@/lib/image-utils";

interface CanvasPreviewProps {
  previewUrl: string;
  draw: (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
}

export default function CanvasPreview({ previewUrl, draw }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!previewUrl || !canvasRef.current) return undefined;
    let cancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    loadImage(previewUrl)
      .then((img) => {
        if (cancelled) return;
        draw(img, canvas, ctx);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [previewUrl, draw]);

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span className="text-[10px] tracking-widest font-medium" style={{ color: "var(--accent)" }}>
          Preview
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="max-h-[400px] w-full object-contain"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      />
    </div>
  );
}
