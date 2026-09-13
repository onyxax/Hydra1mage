"use client";

import { useEffect, useRef } from "react";
import { loadImage } from "@/lib/image";

/**
 * Deep hook: replaces the duplicated drawPreview(dataURL -> Image) dance.
 * Loads previewUrl once, then delegates to `process(img) -> HTMLCanvasElement`
 * and blits result to the target canvas. Handles cancellation & races.
 *
 * Usage:
 * const canvasRef = useCanvasPreview(previewUrl, (img) => rotateImage(img, deg));
 */
export function useCanvasPreview(
  previewUrl: string | null,
  process: (img: HTMLImageElement) => HTMLCanvasElement
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);



  useEffect(() => {
    let cancelled = false;
    if (!previewUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    loadImage(previewUrl)
      .then((img) => {
        if (cancelled) return;
        const result = process(img);
        // check again after async process (process is sync but load is async)
        if (cancelled || !canvasRef.current) return;
        canvas.width = result.width;
        canvas.height = result.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(result, 0, 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [previewUrl, process]);

  return canvasRef;
}
