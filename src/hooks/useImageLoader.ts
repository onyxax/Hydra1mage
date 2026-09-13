"use client";

import { useEffect, useState } from "react";
import { loadImage } from "@/lib/image";

/**
 * Deep hook: centralizes loadImage + cancelled-pattern that was copy-pasted
 * across CropPage, ResizePage, RotateTool, InfoTool.
 */
export function useImageDimensions(previewUrl: string | null) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!previewUrl) {
      setDims(null);
      return;
    }
    let cancelled = false;
    loadImage(previewUrl)
      .then((img) => {
        if (cancelled) return;
        setDims({ w: img.naturalWidth, h: img.naturalHeight });
      })
      .catch(() => {
        if (!cancelled) setDims(null);
      });
    return () => {
      cancelled = true;
    };
  }, [previewUrl]);

  return dims;
}

export function useLoadedImage(previewUrl: string | null) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!previewUrl) {
      setImg(null);
      return;
    }
    let cancelled = false;
    loadImage(previewUrl).then((loaded) => {
      if (!cancelled) setImg(loaded);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [previewUrl]);
  return img;
}
