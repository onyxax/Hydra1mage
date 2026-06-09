"use client";

import DropZone from "@/components/DropZone";
import { ImagePreview, formatFileSize } from "./ImagePreview";

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
  if (!previewUrl) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1
            className="text-3xl font-light tracking-tight"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            {title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        </div>
        <DropZone onFileSelect={onFileSelect} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1
          className="text-3xl font-light tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
        >
          {title}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <ImagePreview
            previewUrl={previewUrl}
            fileName={imageFile!.name}
            fileSize={formatFileSize(imageFile!.size)}
            onClear={onClearImage}
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
