"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useImageContext } from "@/lib/image-context";
import { ImagePreview, formatFileSize } from "@/components/shared/ImagePreview";
import DropZone from "@/components/DropZone";
import {
  Crop,
  Maximize,
  FileDown,
  ArrowRightLeft,
  RotateCw,
  ArrowDownLeft,
  Sun,
  Sparkles,
  Video,
  Info,
  Search,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";

const TOOL_GROUPS = [
  {
    label: "Edit",
    desc: "Shape & frame",
    tools: [
      { href: "/crop", title: "Crop", desc: "Trim dimensions", icon: Crop },
      { href: "/resize", title: "Resize", desc: "Scale to any size", icon: Maximize },
      { href: "/rotate", title: "Rotate", desc: "Spin by degrees", icon: RotateCw },
      { href: "/flip", title: "Flip", desc: "Mirror image", icon: ArrowDownLeft },
    ],
  },
  {
    label: "Optimize",
    desc: "Size & format",
    tools: [
      { href: "/compress", title: "Compress", desc: "Shrink file size", icon: FileDown },
      { href: "/convert", title: "Convert", desc: "Switch formats", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Enhance",
    desc: "Color & style",
    tools: [
      { href: "/adjust", title: "Adjust", desc: "Brightness & contrast", icon: Sun },
      { href: "/effects", title: "Effects", desc: "Blur, sepia, more", icon: Sparkles },
    ],
  },
  {
    label: "Inspect",
    desc: "Analyze & extract",
    tools: [
      { href: "/extract-thumbnail", title: "Thumbnail", desc: "YouTube extractor", icon: Video },
      { href: "/info", title: "Info", desc: "View file details", icon: Info },
    ],
  },
];

export default function HomePage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return TOOL_GROUPS;
    const q = query.toLowerCase();
    return TOOL_GROUPS.map((g) => ({
      ...g,
      tools: g.tools.filter((t) => t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)),
    })).filter((g) => g.tools.length > 0);
  }, [query]);

  const hasImage = !!previewUrl && !!imageFile;

  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      {/* — Hero — */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide"
          style={{ backgroundColor: "var(--accent-soft)", borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
          100% client-side • No upload • Free forever
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            Image tools that respect your privacy
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--text-secondary)" }}>
            Crop, resize, compress, convert, and enhance — all in your browser. Your files never leave your device.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <Shield className="h-3 w-3" /> Private
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <Zap className="h-3 w-3" /> Instant
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Open source
          </span>
        </div>
      </div>

      {/* — Drop / Preview — */}
      <div className="w-full">
        {hasImage ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs" style={{ backgroundColor: "var(--accent-soft)", borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}>
              <span className="flex items-center gap-2 font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Image ready — pick a tool below
              </span>
              <span className="hidden text-[11px] sm:inline" style={{ color: "var(--text-muted)" }}>
                {imageFile.name} will be available in every tool
              </span>
            </div>
            <ImagePreview previewUrl={previewUrl!} fileName={imageFile!.name} fileSize={formatFileSize(imageFile!.size)} onClear={handleClearImage} />
          </div>
        ) : (
          <DropZone onFileSelect={handleFileSelect} />
        )}
      </div>

      {/* — Search — */}
      <div className="flex flex-col gap-4">
        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools — try 'compress', 'crop', 'convert'..."
            className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-[13px]"
            style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }}
          />
        </div>

        {/* — Tools by group — */}
        <div className="flex flex-col gap-6">
          {filteredGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xs font-bold tracking-widest" style={{ color: "var(--text-primary)" }}>
                  {group.label.toUpperCase()}
                </h2>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {group.desc}
                </span>
                <div className="ml-2 h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {group.tools.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className="group/card card flex flex-col gap-3 p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:border-[var(--accent)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                        <t.icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover/card:opacity-100 group-hover/card:translate-x-0 -translate-x-1" style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {t.title}
                      </span>
                      <span className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                        {t.desc}
                      </span>
                    </div>
                    {hasImage && <span className="mt-1 text-[10px] font-medium tracking-wide" style={{ color: "var(--accent)" }}>Ready →</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              No tools match “{query}” — try another keyword.
            </div>
          )}
        </div>
      </div>

      {/* — How it works — */}
      <div className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-3 sm:p-6" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
        {[
          { step: "01", title: "Drop image", desc: "PNG, JPG, WebP, HEIC and more — no upload." },
          { step: "02", title: "Edit instantly", desc: "All processing runs locally via Canvas & WASM." },
          { step: "03", title: "Export", desc: "Download full-resolution PNG, JPG, WebP, etc." },
        ].map((s) => (
          <div key={s.step} className="flex gap-3">
            <span className="text-xs font-bold tracking-widest" style={{ color: "var(--accent)" }}>
              {s.step}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {s.title}
              </span>
              <span className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {s.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
