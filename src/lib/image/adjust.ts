// Hydra1mage — lib/image/adjust.ts
// Deep module: color/lighting adjustments. Hides luminance math and kernel details.
import { createCanvas, get2dContext } from "./core";

export function adjustImage(
  img: HTMLImageElement,
  brightness: number,
  contrast: number,
  saturation: number
): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const bFactor = brightness / 100;
  const cFactor = (contrast + 100) / 100;
  const sFactor = (saturation + 100) / 100;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    r = r * bFactor;
    g = g * bFactor;
    b = b * bFactor;
    r = ((r / 255 - 0.5) * cFactor + 0.5) * 255;
    g = ((g / 255 - 0.5) * cFactor + 0.5) * 255;
    b = ((b / 255 - 0.5) * cFactor + 0.5) * 255;
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + (r - gray) * sFactor;
    g = gray + (g - gray) * sFactor;
    b = gray + (b - gray) * sFactor;
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export interface AdjustOptions {
  exposure: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  vibrance: number;
  gamma: number;
  sharpness: number;
}

export function adjustImageAdvanced(
  img: HTMLImageElement,
  options: AdjustOptions
): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas, { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const exposureF = Math.pow(2, options.exposure / 100);
  const tempShift = options.temperature / 100;
  const tintShift = options.tint / 100;
  const highlightF = options.highlights / 100;
  const shadowF = options.shadows / 100;
  const gamma = options.gamma > 0 ? 1 + options.gamma / 50 : 1 + options.gamma / 200;
  const vibF = options.vibrance / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    r *= exposureF;
    g *= exposureF;
    b *= exposureF;

    r += tempShift * 0.1;
    g += tintShift * 0.02;
    b -= tempShift * 0.1;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (highlightF !== 0 && lum > 0.5) {
      const factor = (lum - 0.5) * 2;
      const adj = -highlightF * factor * 0.8;
      r += adj;
      g += adj;
      b += adj;
    }

    if (shadowF !== 0 && lum < 0.5) {
      const factor = (0.5 - lum) * 2;
      const adj = shadowF * factor * 0.8;
      r += adj;
      g += adj;
      b += adj;
    }

    if (gamma !== 1) {
      r = r > 0 ? Math.pow(r, 1 / gamma) : 0;
      g = g > 0 ? Math.pow(g, 1 / gamma) : 0;
      b = b > 0 ? Math.pow(b, 1 / gamma) : 0;
    }

    if (vibF !== 0) {
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
      const boost = vibF * (1 - sat) * 0.3;
      const avg = (r + g + b) / 3;
      r = r + (r - avg) * boost;
      g = g + (g - avg) * boost;
      b = b + (b - avg) * boost;
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r * 255)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
  }

  if (options.sharpness > 0) {
    const amount = options.sharpness / 100;
    const copy = new ImageData(new Uint8ClampedArray(data), canvas.width, canvas.height);
    const src = copy.data;
    const w = canvas.width;
    const h = canvas.height;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const center = src[idx + c] * 5;
          const neighbors =
            src[((y - 1) * w + x) * 4 + c] +
            src[((y + 1) * w + x) * 4 + c] +
            src[(y * w + x - 1) * 4 + c] +
            src[(y * w + x + 1) * 4 + c];
          const sharp = center - neighbors;
          data[idx + c] = Math.max(0, Math.min(255, Math.round(src[idx + c] + sharp * amount * 0.15)));
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
