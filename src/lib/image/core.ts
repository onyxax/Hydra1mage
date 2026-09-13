// Hydra1mage — lib/image/core.ts
// Primitives shared across all image domains. Deep module: hides canvas bootstrapping.
export type ImageMime =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/avif"
  | "image/bmp"
  | "image/gif"
  | "image/x-icon";

export type ConvertFormat =
  | "png"
  | "jpg"
  | "webp"
  | "avif"
  | "bmp"
  | "gif"
  | "ico"
  | "icns"
  | "tiff"
  | "svg"
  | "pdf";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function get2dContext(
  canvas: HTMLCanvasElement,
  opts?: CanvasRenderingContext2DSettings
): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", opts);
  if (!ctx) throw new Error("2D context unavailable");
  return ctx;
}

export function downloadBlob(blob: Blob, filename: string): void {
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
