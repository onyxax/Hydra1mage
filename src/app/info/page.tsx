"use client";

import { useImageContext } from "@/lib/image-context";
import InfoTool from "@/components/tools/InfoTool";

export default function InfoPage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  return <InfoTool imageFile={imageFile} previewUrl={previewUrl} onFileSelect={handleFileSelect} onClearImage={handleClearImage} />;
}
