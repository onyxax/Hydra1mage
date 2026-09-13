// Hydra1mage — lib/image/compress.ts
// Deep module: compression concerns (quality search, color quantization) isolated.
import type { ImageMime } from "./core";

export function quantizeColors(canvas: HTMLCanvasElement, colors: number): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const step = Math.max(1, Math.floor(256 / colors));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step;
    data[i + 1] = Math.round(data[i + 1] / step) * step;
    data[i + 2] = Math.round(data[i + 2] / step) * step;
  }
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  out.getContext("2d")!.putImageData(imageData, 0, 0);
  return out;
}

export function compressImage(
  canvas: HTMLCanvasElement,
  quality: number,
  format: ImageMime = "image/jpeg"
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to compress image"));
      },
      format,
      quality / 100
    );
  });
}

export interface SmartCompressResult {
  blob: Blob;
  quality: number;
  format: string;
  originalSize: number;
  compressedSize: number;
  savings: number;
}

export async function smartCompress(
  canvas: HTMLCanvasElement,
  originalSize: number,
  format: ImageMime = "image/jpeg",
  targetSizeBytes?: number,
  originalFile?: File,
  colors?: number
): Promise<SmartCompressResult> {
  if (format === "image/png") {
    let workCanvas = canvas;
    if (colors && colors < 256) {
      workCanvas = quantizeColors(canvas, colors);
    }
    const blob = await compressImage(workCanvas, 100, "image/png");
    if (originalFile && blob.size >= originalSize) {
      const origBlob = new Blob([await originalFile.arrayBuffer()], { type: "image/png" });
      return {
        blob: origBlob,
        quality: 100,
        format: "image/png",
        originalSize,
        compressedSize: origBlob.size,
        savings: 0,
      };
    }
    return {
      blob,
      quality: 100,
      format: "image/png",
      originalSize,
      compressedSize: blob.size,
      savings: Math.round(((originalSize - blob.size) / originalSize) * 100),
    };
  }

  if (targetSizeBytes) {
    let low = 1;
    let high = 100;
    let best = 85;
    for (let i = 0; i < 8; i++) {
      const mid = Math.round((low + high) / 2);
      const blob = await compressImage(canvas, mid, format);
      if (blob.size <= targetSizeBytes) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const finalBlob = await compressImage(canvas, best, format);
    return {
      blob: finalBlob,
      quality: best,
      format,
      originalSize,
      compressedSize: finalBlob.size,
      savings: Math.round(((originalSize - finalBlob.size) / originalSize) * 100),
    };
  }

  let bestQuality = 85;
  let bestBlob = await compressImage(canvas, bestQuality, format);
  const targetReduction = 0.3;
  if (bestBlob.size / originalSize > targetReduction) {
    for (const q of [70, 55, 40, 30, 20]) {
      const blob = await compressImage(canvas, q, format);
      if (blob.size / originalSize <= targetReduction || q === 20) {
        bestQuality = q;
        bestBlob = blob;
        break;
      }
    }
  }
  return {
    blob: bestBlob,
    quality: bestQuality,
    format,
    originalSize,
    compressedSize: bestBlob.size,
    savings: Math.round(((originalSize - bestBlob.size) / originalSize) * 100),
  };
}
