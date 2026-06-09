"use client";

import { useImageContext } from "@/lib/image-context";
import EffectsTool from "@/components/tools/EffectsTool";

export default function EffectsPage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  return <EffectsTool imageFile={imageFile} previewUrl={previewUrl} onFileSelect={handleFileSelect} onClearImage={handleClearImage} />;
}
