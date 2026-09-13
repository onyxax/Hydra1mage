// Hydra1mage — lib/image/convert.ts
// Deep module: format conversion. Public API is convertImage + metadata.
// Private encoders (ICO/ICNS/TIFF/SVG/PDF) are hidden implementation details.
import type { ConvertFormat } from "./core";

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
};

export const CONVERT_MIMES = MIME_MAP;

export const CONVERT_FORMATS: { id: ConvertFormat; label: string }[] = [
  { id: "png", label: "PNG" },
  { id: "jpg", label: "JPG" },
  { id: "webp", label: "WebP" },
  { id: "avif", label: "AVIF" },
  { id: "bmp", label: "BMP" },
  { id: "gif", label: "GIF" },
  { id: "tiff", label: "TIFF" },
  { id: "ico", label: "ICO" },
  { id: "icns", label: "ICNS" },
  { id: "svg", label: "SVG" },
  { id: "pdf", label: "PDF" },
];

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
    dv.setUint32(8, entry.data.length, true);
    dv.setUint32(12, dataOffset, true);
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

export function convertImage(canvas: HTMLCanvasElement, targetFormat: ConvertFormat): Promise<Blob> {
  if (targetFormat === "ico") return canvasToIco(canvas);
  if (targetFormat === "icns") return canvasToIcns(canvas);
  if (targetFormat === "tiff") return canvasToTiff(canvas);
  if (targetFormat === "svg") return canvasToSvg(canvas);
  if (targetFormat === "pdf") return canvasToPdf(canvas);

  const mime = MIME_MAP[targetFormat] || "image/png";
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
