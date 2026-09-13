// Hydra1mage — lib/image/effects.ts
// Deep module: all artistic filters together so caller doesn't need to know kernel math.
// Exposes registry EFFECTS so UI doesn't duplicate metadata.
import { createCanvas, get2dContext } from "./core";

// Central registry — UI imports this instead of re-defining effects.
export type EffectId =
  | "blur" | "grayscale" | "sepia" | "invert"
  | "pixelate" | "sharpen" | "emboss" | "noise"
  | "vignette" | "threshold" | "duotone" | "posterize"
  | "edges" | "oilpaint";

export interface EffectMeta {
  id: EffectId;
  label: string;
  desc: string;
  category: "distort" | "style" | "color" | "detail";
  hasSlider?: boolean;
  sliderLabel?: string;
  sliderMin?: number;
  sliderMax?: number;
  sliderDefault?: number;
}

export function blurImage(img: HTMLImageElement, radius: number): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export function grayscaleImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function sepiaImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function invertImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function pixelateImage(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  const w = canvas.width;
  const h = canvas.height;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = 0; dy < size && y + dy < h; dy++) {
        for (let dx = 0; dx < size && x + dx < w; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4;
          rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2]; count++;
        }
      }
      const r = rSum / count, g = gSum / count, b = bSum / count;
      for (let dy = 0; dy < size && y + dy < h; dy++) {
        for (let dx = 0; dx < size && x + dx < w; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4;
          data[i] = r; data[i + 1] = g; data[i + 2] = b;
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function applySharpenKernel(
  src: Uint8ClampedArray, data: Uint8ClampedArray, w: number, h: number, amount: number, strength: number
) {
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[idx + c] * 5;
        const neighbors = src[((y - 1) * w + x) * 4 + c] + src[((y + 1) * w + x) * 4 + c] +
          src[(y * w + x - 1) * 4 + c] + src[(y * w + x + 1) * 4 + c];
        data[idx + c] = Math.max(0, Math.min(255, Math.round(src[idx + c] + (center - neighbors) * amount * strength)));
      }
    }
  }
}

export function sharpenImage(img: HTMLImageElement, amount: number): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas, { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  const w = canvas.width, h = canvas.height;
  const a = amount / 100;
  applySharpenKernel(src, data, w, h, a, 0.2);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function embossImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas, { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  const w = canvas.width, h = canvas.height;
  const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        let sum = 0, ki = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += src[((y + dy) * w + (x + dx)) * 4 + c] * kernel[ki++];
          }
        }
        data[idx + c] = Math.max(0, Math.min(255, sum + 128));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function noiseImage(img: HTMLImageElement, intensity: number): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const strength = intensity * 2.55;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * strength;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function vignetteImage(img: HTMLImageElement, strength: number): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const factor = strength / 100;
  const maxDistSq = maxDist * maxDist;
  for (let y = 0; y < h; y++) {
    const dy = y - cy;
    const dySq = dy * dy;
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const distSq = (dx * dx + dySq) / maxDistSq;
      const darken = 1 - distSq * factor;
      const idx = (y * w + x) * 4;
      data[idx] = Math.max(0, data[idx] * darken);
      data[idx + 1] = Math.max(0, data[idx + 1] * darken);
      data[idx + 2] = Math.max(0, data[idx + 2] * darken);
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function thresholdImage(img: HTMLImageElement, level: number): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const thresh = level * 2.55;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const v = gray >= thresh ? 255 : 0;
    data[i] = v; data[i + 1] = v; data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function duotoneImage(img: HTMLImageElement, color1: string, color2: string): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const parse = (hex: string) => {
    const m = hex.match(/\w\w/g)!;
    return m.map((h) => parseInt(h, 16));
  };
  const [r1, g1, b1] = parse(color1);
  const [r2, g2, b2] = parse(color2);
  for (let i = 0; i < data.length; i += 4) {
    const gray = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    data[i] = r1 + (r2 - r1) * gray;
    data[i + 1] = g1 + (g2 - g1) * gray;
    data[i + 2] = b1 + (b2 - b1) * gray;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function posterizeImage(img: HTMLImageElement, levels: number): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i] / step) * step);
    data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
    data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function edgeDetectImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas, { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  const w = canvas.width, h = canvas.height;
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      let sumX = 0, sumY = 0, ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const gray = 0.299 * src[((y + dy) * w + (x + dx)) * 4] +
            0.587 * src[((y + dy) * w + (x + dx)) * 4 + 1] +
            0.114 * src[((y + dy) * w + (x + dx)) * 4 + 2];
          sumX += gray * gx[ki];
          sumY += gray * gy[ki];
          ki++;
        }
      }
      const edge = Math.min(255, Math.sqrt(sumX * sumX + sumY * sumY));
      data[idx] = edge; data[idx + 1] = edge; data[idx + 2] = edge;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function oilPaintImage(img: HTMLImageElement, radius: number): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  const w = canvas.width, h = canvas.height;
  const r = Math.max(1, Math.min(radius, 10));
  const area = (2 * r + 1) * (2 * r + 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum = 0, gSum = 0, bSum = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const ny = Math.min(h - 1, Math.max(0, y + dy));
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const i = (ny * w + nx) * 4;
          rSum += src[i]; gSum += src[i + 1]; bSum += src[i + 2];
        }
      }
      const idx = (y * w + x) * 4;
      data[idx] = rSum / area; data[idx + 1] = gSum / area; data[idx + 2] = bSum / area;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
