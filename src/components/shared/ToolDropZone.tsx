"use client";

import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";

interface ToolDropZoneProps {
  onFileSelect: (file: File) => void;
}

const FORMATS = ["PNG", "JPG", "WebP", "HEIC", "GIF", "SVG", "BMP", "TIFF", "AVIF"];

export default function ToolDropZone({ onFileSelect }: ToolDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  return (
    <div
      className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-colors duration-200 cursor-pointer sm:gap-4 sm:py-16"
      style={{
        borderColor: isDragOver ? "var(--accent)" : "var(--border)",
        backgroundColor: isDragOver ? "var(--accent-soft)" : "transparent",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isDragOver) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragOver) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        }
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--accent-soft)" }}
      >
        <Upload className="h-6 w-6" style={{ color: "var(--accent)" }} />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Drop your image here
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          or click to browse files
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {FORMATS.map((fmt) => (
          <span key={fmt} className="rounded-md border px-1.5 py-0.5 text-[9px] font-medium sm:px-2 sm:py-1 sm:text-[10px]" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {fmt}
          </span>
        ))}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
