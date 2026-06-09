"use client";

import { useImageContext } from "@/lib/image-context";
import ExtractThumbnailTool from "@/components/tools/ExtractThumbnailTool";

export default function ExtractThumbnailPage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  return (
    <ExtractThumbnailTool
      imageFile={imageFile}
      previewUrl={previewUrl}
      onFileSelect={handleFileSelect}
      onClearImage={handleClearImage}
    />
  );
}
