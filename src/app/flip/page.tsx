"use client";

import { useImageContext } from "@/lib/image-context";
import FlipTool from "@/components/tools/FlipTool";

export default function FlipPage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  return <FlipTool imageFile={imageFile} previewUrl={previewUrl} onFileSelect={handleFileSelect} onClearImage={handleClearImage} />;
}
