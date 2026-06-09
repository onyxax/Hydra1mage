"use client";

import { useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/svg+xml",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/tif",
]);

const ACCEPTED_EXTENSIONS = /\.(png|jpe?g|webp|heic|heif|svg|gif|bmp|tiff?|avif)$/i;
const FORMATS = ["PNG", "JPG", "WebP", "HEIC", "GIF", "SVG", "BMP", "TIFF", "AVIF"];

export default function DropZone({ onFileSelect }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (
        ACCEPTED_TYPES.has(file.type) ||
        ACCEPTED_EXTENSIONS.test(file.name)
      ) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [processFile]
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className="group flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-16 transition-colors duration-200"
      style={{
        borderColor: dragging ? "var(--accent)" : "var(--border)",
        backgroundColor: dragging ? "var(--accent-soft)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!dragging) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
        }
      }}
      onMouseLeave={(e) => {
        if (!dragging) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif,image/svg+xml,image/gif,image/bmp,image/tiff"
        onChange={handleInputChange}
        className="hidden"
      />
      <div
        className="flex h-14 w-14 items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--accent-soft)" }}
      >
        <Upload className="h-6 w-6" style={{ color: "var(--accent)" }} />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {dragging ? "Release to upload" : "Drop your image here"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {dragging ? "" : "or click to browse files"}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {FORMATS.map((fmt) => (
          <span key={fmt} className="rounded-md border px-2 py-1 text-[10px] font-medium" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {fmt}
          </span>
        ))}
      </div>
    </div>
  );
}
