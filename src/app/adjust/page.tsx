"use client";

import { useImageContext } from "@/lib/image-context";
import AdjustTool from "@/components/tools/AdjustTool";

export default function AdjustPage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  return <AdjustTool imageFile={imageFile} previewUrl={previewUrl} onFileSelect={handleFileSelect} onClearImage={handleClearImage} />;
}
