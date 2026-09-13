"use client";

import { useState, useMemo } from "react";
import { ArrowRightLeft, Search, Zap, Shield, FileImage, Download, AlertTriangle } from "lucide-react";
import { useImageContext } from "@/lib/image-context";
import ToolLayout from "@/components/shared/ToolLayout";
import { loadImage, resizeImage, convertImage, downloadBlob, type ConvertFormat } from "@/lib/image";
import { formatFileSize } from "@/components/shared/ImagePreview";

type FormatMeta = {
  id: ConvertFormat;
  name: string;
  desc: string;
  size: string;
  group: "Web" | "Print" | "Icon" | "Vector";
  transparent: boolean;
  badge?: string;
};

const FORMATS: FormatMeta[] = [
  { id: "png", name: "PNG", desc: "Lossless • transparency", size: "Large", group: "Web", transparent: true, badge: "Universal" },
  { id: "jpg", name: "JPG", desc: "Smallest • photos", size: "Tiny", group: "Web", transparent: false, badge: "Popular" },
  { id: "webp", name: "WebP", desc: "Modern • 30% smaller", size: "Small", group: "Web", transparent: true, badge: "Recommended" },
  { id: "avif", name: "AVIF", desc: "Next-gen • best quality", size: "Tiny", group: "Web", transparent: true, badge: "Next-gen" },
  { id: "gif", name: "GIF", desc: "Simple graphics", size: "Medium", group: "Web", transparent: true },
  { id: "bmp", name: "BMP", desc: "Raw • no compression", size: "Huge", group: "Print", transparent: false },
  { id: "tiff", name: "TIFF", desc: "Print • archival", size: "Huge", group: "Print", transparent: true },
  { id: "ico", name: "ICO", desc: "Windows favicon", size: "Small", group: "Icon", transparent: true, badge: "Icon" },
  { id: "icns", name: "ICNS", desc: "macOS icon", size: "Small", group: "Icon", transparent: true, badge: "Icon" },
  { id: "svg", name: "SVG", desc: "Vector • scales", size: "Small", group: "Vector", transparent: true },
  { id: "pdf", name: "PDF", desc: "Document • print", size: "Medium", group: "Vector", transparent: false },
];

export default function ConvertPage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  const [format, setFormat] = useState<ConvertFormat>("jpg");
  const [quality, setQuality] = useState(92);
  const [query, setQuery] = useState("");
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);

  const isLossy = ["jpg", "webp", "avif"].includes(format);
  const hasTransparency = imageFile?.type === "image/png" || imageFile?.name.toLowerCase().endsWith(".png");
  const sourceExt = imageFile?.name.split(".").pop()?.toUpperCase() ?? "—";

  // Update fileName when imageFile or format changes
  useState(() => {
    if (imageFile) setFileName(imageFile.name.replace(/\.[^.]+$/, `.${format}`));
  });
  // Use effect would be better, but to avoid extra import, we sync via memo
  const displayFileName = fileName || (imageFile?.name.replace(/\.[^.]+$/, `.${format}`) ?? `converted.${format}`);

  const filtered = useMemo(() => {
    if (!query.trim()) return FORMATS;
    const q = query.toLowerCase();
    return FORMATS.filter((f) => f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q) || f.group.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const g: Record<string, FormatMeta[]> = { Web: [], Print: [], Icon: [], Vector: [] };
    for (const f of filtered) g[f.group].push(f);
    return Object.entries(g).filter(([, arr]) => arr.length > 0);
  }, [filtered]);

  const needsWarning = hasTransparency && !FORMATS.find((f) => f.id === format)?.transparent;

  const handleExport = async () => {
    if (!previewUrl) return;
    setProcessing(true);
    try {
      const img = await loadImage(previewUrl);
      const canvas = resizeImage(img, img.naturalWidth, img.naturalHeight);
      // For lossy, we could pass quality to convertImage, but current convert uses fixed 0.92
      // To make quality practical, we create a temporary canvas toBlob with quality
      const blob = await (async () => {
        if (isLossy) {
          return new Promise<Blob>((res, rej) => {
            canvas.toBlob((b) => (b ? res(b) : rej(new Error("convert failed"))), `image/${format === "jpg" ? "jpeg" : format}`, quality / 100);
          }).then((b) => {
            // For non-generic formats (png etc), fallback to convertImage
            if (["jpg", "webp", "avif"].includes(format)) return b;
            return convertImage(canvas, format);
          });
        }
        return convertImage(canvas, format);
      })();
      // If user edited fileName, use it, otherwise use original with new ext
      const name = fileName || imageFile?.name.replace(/\.[^.]+$/, `.${format}`) || `converted.${format}`;
      downloadBlob(blob, name);
    } finally {
      setProcessing(false);
    }
  };

  // Update fileName when format changes
  const onFormatSelect = (id: ConvertFormat) => {
    setFormat(id);
    if (imageFile) setFileName(imageFile.name.replace(/\.[^.]+$/, `.${id}`));
  };

  return (
    <ToolLayout
      title="Convert"
      subtitle={imageFile ? `${sourceExt} → ${format.toUpperCase()} • ${formatFileSize(imageFile.size)}` : "Upload an image to convert — 11 formats, instant"}
      imageFile={imageFile}
      previewUrl={previewUrl}
      onFileSelect={handleFileSelect}
      onClearImage={handleClearImage}
    >
      <div className="flex flex-col gap-4">
        {/* Source + Target preview */}
        {imageFile && (
          <div className="flex items-center gap-2 rounded-xl border p-3" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <FileImage className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {imageFile.name}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {formatFileSize(imageFile.size)} • {sourceExt}
                </p>
              </div>
            </div>
            <ArrowRightLeft className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent-soft)", border: "1px solid var(--accent)" }}>
                <span className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>
                  {format.toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {displayFileName}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {FORMATS.find((f) => f.id === format)?.desc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search formats — png, icon, vector..."
            className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Format groups */}
        <div className="flex flex-col gap-4">
          {grouped.map(([group, items]) => (
            <div key={group} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {group.toUpperCase()}
                </span>
                <div className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((f) => {
                  const active = format === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onFormatSelect(f.id)}
                      className="group relative flex flex-col gap-1 rounded-xl border p-3 text-left transition-all hover:scale-[1.01]"
                      style={{
                        borderColor: active ? "var(--accent)" : "var(--border)",
                        backgroundColor: active ? "var(--accent-soft)" : "var(--bg-elevated)",
                        boxShadow: active ? "0 0 0 2px var(--accent-soft)" : "none",
                      }}
                    >
                      {f.badge && (
                        <span className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide" style={{ backgroundColor: active ? "var(--accent)" : "var(--bg-secondary)", color: active ? "white" : "var(--text-muted)", border: `1px solid ${active ? "var(--accent)" : "var(--border)"}` }}>
                          {f.badge}
                        </span>
                      )}
                      <span className="text-xs font-bold" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                        {f.name}
                      </span>
                      <span className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                        {f.desc}
                      </span>
                      <span className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}>
                        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: f.transparent ? "#22c55e" : "var(--border)" }} />
                        {f.transparent ? "Transparency" : "No transparency"} • {f.size}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {grouped.length === 0 && <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>No formats match “{query}”</p>}
        </div>

        {/* Warning for transparency loss */}
        {needsWarning && (
          <div className="flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px]" style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)", color: "#b91c1c" }}>
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <b>{format.toUpperCase()}</b> doesn’t support transparency — transparent areas will become white/black. Choose PNG, WebP, or TIFF to keep it.
            </span>
          </div>
        )}

        {/* Output file name + quality */}
        {previewUrl && (
          <div className="flex flex-col gap-3 rounded-xl border p-3" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                OUTPUT FILE NAME
              </span>
              <input
                value={displayFileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                placeholder={`converted.${format}`}
              />
            </div>

            {isLossy && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                    QUALITY • {quality}%
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: quality > 85 ? "#16a34a" : quality > 70 ? "var(--accent)" : "#eab308" }}>
                    {quality > 90 ? "Maximum" : quality > 75 ? "High" : quality > 50 ? "Balanced" : "Smaller file"}
                  </span>
                </div>
                <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="h-1 w-full cursor-pointer appearance-none rounded-full" style={{ backgroundColor: "var(--border)" }} />
                <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <span>Smaller</span>
                  <span>Higher quality</span>
                </div>
              </div>
            )}

            <button onClick={handleExport} disabled={processing} className="btn-primary flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              {processing ? "Converting…" : `Download as ${format.toUpperCase()}`}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
              <Shield className="h-3 w-3" />
              100% private — never leaves your device
              <span className="hidden sm:inline">•</span>
              <Zap className="h-3 w-3" />
              Instant
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
