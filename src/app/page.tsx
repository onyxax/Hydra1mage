"use client";

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
} from "lucide-react";

const TOOLS = [
  { href: "/crop", title: "Crop", desc: "Trim dimensions", icon: Crop },
  { href: "/resize", title: "Resize", desc: "Scale to any size", icon: Maximize },
  { href: "/compress", title: "Compress", desc: "Shrink file size", icon: FileDown },
  { href: "/convert", title: "Convert", desc: "Switch formats", icon: ArrowRightLeft },
  { href: "/rotate", title: "Rotate", desc: "Spin by degrees", icon: RotateCw },
  { href: "/flip", title: "Flip", desc: "Mirror image", icon: ArrowDownLeft },
  { href: "/adjust", title: "Adjust", desc: "Brightness & contrast", icon: Sun },
  { href: "/effects", title: "Effects", desc: "Blur, sepia, more", icon: Sparkles },
  { href: "/extract-thumbnail", title: "Thumbnail", desc: "YouTube thumbnail extractor", icon: Video },
  { href: "/info", title: "Info", desc: "View file details", icon: Info },
];

export default function HomePage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="text-center">
        <h1
          className="text-4xl font-light tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
        >
          Hydra1mage
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Upload. Edit. Export. All in your browser.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        {previewUrl && imageFile ? (
          <ImagePreview
            previewUrl={previewUrl}
            fileName={imageFile.name}
            fileSize={formatFileSize(imageFile.size)}
            onClear={handleClearImage}
          />
        ) : (
          <DropZone onFileSelect={handleFileSelect} />
        )}
      </div>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="card flex flex-col items-center text-center gap-3 py-5 transition-all duration-200 hover:scale-[1.03]"
          >
            <t.icon className="h-6 w-6" style={{ color: "var(--accent)" }} />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {t.title}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {t.desc}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
