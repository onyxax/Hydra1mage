export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function cropImage(
  img: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return canvas;
}

export function resizeImage(
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas;
}

export type ImageMime = "image/png" | "image/jpeg" | "image/webp" | "image/avif" | "image/bmp" | "image/gif" | "image/x-icon";

export function quantizeColors(
  canvas: HTMLCanvasElement,
  colors: number
): HTMLCanvasElement {
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

export type ConvertFormat = "png" | "jpg" | "webp" | "avif" | "bmp" | "gif" | "ico" | "icns" | "tiff" | "svg" | "pdf";

async function canvasToIco(canvas: HTMLCanvasElement): Promise<Blob> {
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBlobs: { w: number; h: number; data: Uint8Array }[] = [];

  for (const size of sizes) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0, size, size);
    const blob = await new Promise<Blob>((resolve, reject) => {
      c.toBlob((b) => (b ? resolve(b) : reject()), "image/png");
    });
    const buf = new Uint8Array(await blob.arrayBuffer());
    pngBlobs.push({ w: size, h: size, data: buf });
  }

  const headerLen = 6;
  const dirLen = 16 * pngBlobs.length;
  let dataOffset = headerLen + dirLen;
  const entries: Uint8Array[] = [];
  const dirEntries: Uint8Array[] = [];

  for (const entry of pngBlobs) {
    const w = entry.w >= 256 ? 0 : entry.w;
    const h = entry.h >= 256 ? 0 : entry.h;
    const dir = new Uint8Array(16);
    dir[0] = w;
    dir[1] = h;
    dir[2] = 0;
    dir[3] = 0;
    dir[4] = 1;
    dir[5] = 0;
    dir[6] = 32;
    dir[7] = 0;
    const dv = new DataView(dir.buffer);
    dv.setUint16(8, entry.w, true);
    dv.setUint16(10, entry.h, true);
    dv.setUint32(12, entry.data.length, true);
    dv.setUint32(16, dataOffset, true);
    dataOffset += entry.data.length;
    dirEntries.push(dir);
    entries.push(entry.data);
  }

  const total = headerLen + dirLen + entries.reduce((s, e) => s + e.length, 0);
  const result = new Uint8Array(total);
  const view = new DataView(result.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, pngBlobs.length, true);

  let offset = headerLen;
  for (const dir of dirEntries) {
    result.set(dir, offset);
    offset += dir.length;
  }
  for (const entry of entries) {
    result.set(entry, offset);
    offset += entry.length;
  }

  return new Blob([result], { type: "image/x-icon" });
}

async function canvasToIcns(canvas: HTMLCanvasElement): Promise<Blob> {
  const sizes = [16, 32, 48, 128, 256, 512];
  const iconTypes = ["icp4", "icp5", "icp6", "ic07", "ic08", "ic09"];
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0, size, size);
    const blob = await new Promise<Blob>((resolve, reject) => {
      c.toBlob((b) => (b ? resolve(b) : reject()), "image/png");
    });
    const pngData = new Uint8Array(await blob.arrayBuffer());
    const typeBytes = new Uint8Array(4);
    for (let j = 0; j < 4; j++) typeBytes[j] = iconTypes[i].charCodeAt(j);
    const chunkHeader = new Uint8Array(8);
    chunkHeader.set(typeBytes, 0);
    new DataView(chunkHeader.buffer).setUint32(4, 8 + pngData.length, false);
    const chunk = new Uint8Array(8 + pngData.length);
    chunk.set(chunkHeader, 0);
    chunk.set(pngData, 8);
    chunks.push(chunk);
  }

  let totalData = 0;
  for (const chunk of chunks) totalData += chunk.length;
  const icnsSize = 8 + totalData;
  const result = new Uint8Array(icnsSize);
  const view = new DataView(result.buffer);
  for (let i = 0; i < 4; i++) result[i] = "icns".charCodeAt(i);
  view.setUint32(4, icnsSize, false);

  let offset = 8;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return new Blob([result], { type: "image/icns" });
}

async function canvasToTiff(canvas: HTMLCanvasElement): Promise<Blob> {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;

  const rowBytes = w * 3;
  const imageDataSize = rowBytes * h;
  const stripOffsetsOffset = 8;
  const stripCountsOffset = stripOffsetsOffset + 4;
  const xResOffset = stripCountsOffset + 4;
  const yResOffset = xResOffset + 8;
  const imageDataOffset = yResOffset + 8;
  const ifdOffset = imageDataOffset + imageDataSize;

  const ifdEntries = 12;
  const ifdSize = 2 + ifdEntries * 12 + 4;
  const totalSize = ifdOffset + ifdSize;

  const buf = new ArrayBuffer(totalSize);
  const v = new DataView(buf);
  const u = new Uint8Array(buf);

  let o = 0;
  u[o++] = 0x49; u[o++] = 0x49;
  v.setUint16(o, 42, true); o += 2;
  v.setUint32(o, ifdOffset, true); o += 4;

  u[stripOffsetsOffset] = imageDataOffset & 0xff;
  u[stripOffsetsOffset + 1] = (imageDataOffset >> 8) & 0xff;
  u[stripCountsOffset] = imageDataSize & 0xff;
  u[stripCountsOffset + 1] = (imageDataSize >> 8) & 0xff;

  v.setUint32(xResOffset, 72, true);
  v.setUint32(xResOffset + 4, 1, true);
  v.setUint32(yResOffset, 72, true);
  v.setUint32(yResOffset + 4, 1, true);

  let i = 0;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const si = (row * w + col) * 4;
      u[imageDataOffset + i++] = px[si];
      u[imageDataOffset + i++] = px[si + 1];
      u[imageDataOffset + i++] = px[si + 2];
    }
  }

  o = ifdOffset;
  v.setUint16(o, ifdEntries, true); o += 2;

  const tag = (t: number, tp: number, cnt: number, val: number) => {
    v.setUint16(o, t, true); o += 2;
    v.setUint16(o, tp, true); o += 2;
    v.setUint32(o, cnt, true); o += 4;
    v.setUint32(o, val, true); o += 4;
  };

  tag(256, 3, 1, w);
  tag(257, 3, 1, h);
  tag(258, 3, 1, 8);
  tag(259, 3, 1, 1);
  tag(262, 3, 1, 2);
  tag(273, 4, 1, imageDataOffset);
  tag(274, 3, 1, 1);
  tag(277, 3, 1, 3);
  tag(278, 4, 1, h);
  tag(279, 4, 1, imageDataSize);
  tag(282, 5, 1, xResOffset);
  tag(283, 5, 1, yResOffset);

  v.setUint32(o, 0, true);

  return new Blob([buf], { type: "image/tiff" });
}

function canvasToSvg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(new Blob([], { type: "image/svg+xml" })); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image xlink:href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`;
        resolve(new Blob([svg], { type: "image/svg+xml" }));
      };
      reader.readAsDataURL(blob);
    }, "image/png");
  });
}

async function canvasToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject()), "image/jpeg", 0.92);
  });
  const jpegData = new Uint8Array(await jpegBlob.arrayBuffer());
  const w = canvas.width;
  const h = canvas.height;

  const pdfW = (w * 72) / 96;
  const pdfH = (h * 72) / 96;

  const parts: Uint8Array[] = [];
  const encoder = new TextEncoder();
  const push = (str: string) => parts.push(encoder.encode(str));

  push("%PDF-1.4\n");
  const offsets: number[] = [];

  offsets.push(parts.reduce((a, p) => a + p.length, 0));
  push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  offsets.push(parts.reduce((a, p) => a + p.length, 0));
  push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  offsets.push(parts.reduce((a, p) => a + p.length, 0));
  push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfW.toFixed(2)} ${pdfH.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Img 5 0 R >> >> >>\nendobj\n`);

  const stream = `q ${pdfW.toFixed(2)} 0 0 ${pdfH.toFixed(2)} 0 0 cm /Img Do Q`;
  offsets.push(parts.reduce((a, p) => a + p.length, 0));
  push(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);

  offsets.push(parts.reduce((a, p) => a + p.length, 0));
  push(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegData.length} >>\nstream\n`);

  parts.push(jpegData);
  push("\nendstream\nendobj\n");

  const xrefOffset = parts.reduce((a, p) => a + p.length, 0);
  let xref = "xref\n0 6\n";
  xref += "0000000000 65535 f \n";
  for (const off of offsets) xref += String(off).padStart(10, "0") + " 00000 n \n";
  push(xref);

  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  let total = 0;
  for (const p of parts) total += p.length;
  const result = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }

  return new Blob([result], { type: "application/pdf" });
}

export function convertImage(
  canvas: HTMLCanvasElement,
  targetFormat: ConvertFormat
): Promise<Blob> {
  if (targetFormat === "ico") return canvasToIco(canvas);
  if (targetFormat === "icns") return canvasToIcns(canvas);
  if (targetFormat === "tiff") return canvasToTiff(canvas);
  if (targetFormat === "svg") return canvasToSvg(canvas);
  if (targetFormat === "pdf") return canvasToPdf(canvas);

  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp",
    avif: "image/avif",
    bmp: "image/bmp",
    gif: "image/gif",
  };
  const mime = mimeMap[targetFormat] || "image/png";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert image"));
      },
      mime,
      0.92
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getMimeType(file: File): string {
  return file.type || "image/jpeg";
}

export function getExtensionFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("tiff")) return "tiff";
  if (mime.includes("svg")) return "svg";
  if (mime.includes("pdf")) return "pdf";
  return "jpg";
}

/* ─────────────────────── Rotate ─────────────────────── */

export function rotateImage(
  img: HTMLImageElement,
  degrees: number
): HTMLCanvasElement {
  const rad = (degrees * Math.PI) / 180;
  const abs = Math.abs;
  const sin = abs(Math.sin(rad));
  const cos = abs(Math.cos(rad));
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const newW = Math.floor(w * cos + h * sin);
  const newH = Math.floor(w * sin + h * cos);
  const canvas = document.createElement("canvas");
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -w / 2, -h / 2);
  return canvas;
}

/* ─────────────────────── Flip ─────────────────────── */

export function flipImage(
  img: HTMLImageElement,
  horizontal: boolean,
  vertical: boolean
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(horizontal ? canvas.width : 0, vertical ? canvas.height : 0);
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  ctx.drawImage(img, 0, 0);
  return canvas;
}

/* ─────────────────────── Brightness / Contrast / Saturation ─────────────────────── */

export function adjustImage(
  img: HTMLImageElement,
  brightness: number,
  contrast: number,
  saturation: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
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

export function blurImage(
  img: HTMLImageElement,
  radius: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export function grayscaleImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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

export function sharpenImage(img: HTMLImageElement, amount: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  const w = canvas.width, h = canvas.height;
  const a = amount / 100;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[idx + c] * 5;
        const neighbors = src[((y - 1) * w + x) * 4 + c] + src[((y + 1) * w + x) * 4 + c] +
          src[(y * w + x - 1) * 4 + c] + src[(y * w + x + 1) * 4 + c];
        data[idx + c] = Math.max(0, Math.min(255, Math.round(src[idx + c] + (center - neighbors) * a * 0.2)));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function embossImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
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
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
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

/* ─────────────────────── Format Info ─────────────────────── */

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
