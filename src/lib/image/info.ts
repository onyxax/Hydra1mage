// Hydra1mage — lib/image/info.ts
// Deep module: metadata extraction (dimensions, palette, brightness). No pixel-mutation.
import { loadImage } from "./core";

export interface ImageInfo {
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  aspectRatio: string;
  lastModified: number;
  megapixels: number;
  bitsPerPixel: number;
  memoryBytes: number;
  hasAlpha: boolean;
  colorSpace: string;
  orientation: "landscape" | "portrait" | "square";
  dominantColors: string[];
  averageBrightness: number;
  fileSizeCategory: "tiny" | "small" | "medium" | "large" | "huge";
}

export async function getImageInfo(file: File, src: string): Promise<ImageInfo> {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);

  const canvas = document.createElement("canvas");
  const sampleW = Math.min(w, 100);
  const sampleH = Math.min(h, Math.round((sampleW / w) * h));
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const pixels = imageData.data;

  let hasAlpha = false;
  let totalBrightness = 0;
  const colorBuckets = new Map<string, number>();

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 255) hasAlpha = true;

    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    totalBrightness += brightness;

    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1);
  }

  const pixelCount = sampleW * sampleH;
  const avgBrightness = totalBrightness / pixelCount;

  const sorted = [...colorBuckets.entries()].sort((a, b) => b[1] - a[1]);
  const dominantColors = sorted.slice(0, 5).map(([key]) => {
    const [r, g, b] = key.split(",").map(Number);
    return `rgb(${r}, ${g}, ${b})`;
  });

  const bitsPerPixel = Math.round((file.size * 8) / (w * h));

  const fileSizeCategory: ImageInfo["fileSizeCategory"] =
    file.size < 10_000 ? "tiny" :
    file.size < 100_000 ? "small" :
    file.size < 1_000_000 ? "medium" :
    file.size < 10_000_000 ? "large" : "huge";

  const orientation: ImageInfo["orientation"] =
    w === h ? "square" : w > h ? "landscape" : "portrait";

  const mimeToSpace: Record<string, string> = {
    "image/png": "sRGB (lossless)",
    "image/jpeg": "sRGB (lossy)",
    "image/webp": "sRGB",
    "image/avif": "sRGB / HDR",
    "image/gif": "sRGB (indexed)",
    "image/bmp": "sRGB",
  };

  return {
    name: file.name,
    type: file.type || "unknown",
    size: file.size,
    width: w,
    height: h,
    aspectRatio: `${w / d}:${h / d}`,
    lastModified: file.lastModified,
    megapixels: (w * h) / 1_000_000,
    bitsPerPixel,
    memoryBytes: w * h * 4,
    hasAlpha,
    colorSpace: mimeToSpace[file.type] || "Unknown",
    orientation,
    dominantColors,
    averageBrightness: avgBrightness,
    fileSizeCategory,
  };
}
