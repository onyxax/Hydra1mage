"use client";

import { useImageContext } from "@/lib/image-context";
import RotateTool from "@/components/tools/RotateTool";

export default function RotatePage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  return <RotateTool imageFile={imageFile} previewUrl={previewUrl} onFileSelect={handleFileSelect} onClearImage={handleClearImage} />;
}
