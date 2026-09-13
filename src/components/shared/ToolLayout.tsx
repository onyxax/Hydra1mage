"use client";

import DropZone from "@/components/DropZone";
import { formatFileSize } from "./ImagePreview";
import { ToolHeader } from "./ToolHeader";
import { SmartImagePreview } from "./SmartPreview";
import { useImageDimensions } from "@/hooks/useImageLoader";

export default function ToolLayout({
  title,
  subtitle,
  imageFile,
  previewUrl,
  onFileSelect,
  onClearImage,
  livePreview,
  children,
}: {
  title: string;
  subtitle: string;
  imageFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClearImage: () => void;
  livePreview?: React.ReactNode;
  children: React.ReactNode;
}) {
  const dims = useImageDimensions(previewUrl);

  // Defensive: previewUrl and imageFile must both exist; otherwise sync race or clear caused null file.
  if (!previewUrl || !imageFile) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <ToolHeader title={title} subtitle={subtitle} />
        <DropZone onFileSelect={onFileSelect} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <ToolHeader title={title} subtitle={subtitle} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <SmartImagePreview
            previewUrl={previewUrl}
            fileName={imageFile.name}
            fileSize={formatFileSize(imageFile.size)}
            dims={dims}
            title={title}
            subtitle={`${dims ? `${dims.w} × ${dims.h}` : ""} • ${imageFile.type || "image"}`}
            badge={imageFile.name.split(".").pop()?.toUpperCase()}
            headerAction={
              <button
                onClick={onClearImage}
                className="rounded-lg border px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                Change
              </button>
            }
          />
          {livePreview}
        </div>
        <div className="flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}
