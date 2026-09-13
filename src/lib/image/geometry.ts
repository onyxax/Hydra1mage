// Hydra1mage — lib/image/geometry.ts
// Deep module: all spatial transforms (crop/resize/rotate/flip) live together.
import { createCanvas, get2dContext } from "./core";

export function cropImage(
  img: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): HTMLCanvasElement {
  const canvas = createCanvas(cropW, cropH);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return canvas;
}

export function resizeImage(
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): HTMLCanvasElement {
  const canvas = createCanvas(targetW, targetH);
  const ctx = get2dContext(canvas);
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas;
}

export function rotateImage(img: HTMLImageElement, degrees: number): HTMLCanvasElement {
  const rad = (degrees * Math.PI) / 180;
  const abs = Math.abs;
  const sin = abs(Math.sin(rad));
  const cos = abs(Math.cos(rad));
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const newW = Math.floor(w * cos + h * sin);
  const newH = Math.floor(w * sin + h * cos);
  const canvas = createCanvas(newW, newH);
  const ctx = get2dContext(canvas);
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -w / 2, -h / 2);
  return canvas;
}

export function flipImage(
  img: HTMLImageElement,
  horizontal: boolean,
  vertical: boolean
): HTMLCanvasElement {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = get2dContext(canvas);
  ctx.translate(horizontal ? canvas.width : 0, vertical ? canvas.height : 0);
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  ctx.drawImage(img, 0, 0);
  return canvas;
}
