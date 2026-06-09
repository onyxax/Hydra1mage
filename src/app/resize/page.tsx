"use client";

import { useState, useEffect, useRef } from "react";
import { Maximize, Lock, Unlock } from "lucide-react";
import { useImageContext } from "@/lib/image-context";
import ToolLayout from "@/components/shared/ToolLayout";
import ToolCard from "@/components/ToolCard";
import { InputField } from "@/components/shared/InputField";
import { ExportButton } from "@/components/shared/ExportButton";
import { loadImage, resizeImage, downloadBlob, getExtensionFromMime } from "@/lib/image-utils";

export default function ResizePage() {
  const { imageFile, previewUrl, handleFileSelect, handleClearImage } = useImageContext();
  const [resizeW, setResizeW] = useState("");
  const [resizeH, setResizeH] = useState("");
  const [aspectLocked, setAspectLocked] = useState(true);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null);
  const aspectRef = useRef(1);

  useEffect(() => {
    if (!previewUrl) return undefined;
    let cancelled = false;
    loadImage(previewUrl)
      .then((img) => {
        if (cancelled) return;
        const w = img.naturalWidth, h = img.naturalHeight;
        setImgNatural({ w, h });
        setResizeW(String(w));
        setResizeH(String(h));
        aspectRef.current = w / h;
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [previewUrl]);

  const handleWChange = (v: string) => {
    setResizeW(v);
    if (aspectLocked && imgNatural) {
      const num = Number(v);
      if (num > 0) setResizeH(String(Math.round(num / aspectRef.current)));
    }
  };

  const handleHChange = (v: string) => {
    setResizeH(v);
    if (aspectLocked && imgNatural) {
      const num = Number(v);
      if (num > 0) setResizeW(String(Math.round(num * aspectRef.current)));
    }
  };

  const handleExport = async () => {
    if (!previewUrl) return;
    const img = await loadImage(previewUrl);
    const tw = Number(resizeW) || img.naturalWidth;
    const th = Number(resizeH) || img.naturalHeight;
    const canvas = resizeImage(img, tw, th);
    canvas.toBlob((blob) => {
      if (blob) {
        const ext = getExtensionFromMime(blob.type);
        const name = imageFile?.name.replace(/\.[^.]+$/, `_resized.${ext}`) || `resized.${ext}`;
        downloadBlob(blob, name);
      }
    }, "image/png");
  };

  return (
    <ToolLayout
      title="Resize"
      subtitle={imgNatural ? `${imgNatural.w} x ${imgNatural.h} px` : "Upload an image to resize"}
      imageFile={imageFile} previewUrl={previewUrl} onFileSelect={handleFileSelect} onClearImage={handleClearImage}
    >
      <ToolCard title="Resize Dimensions" icon={Maximize} zone="Adjustments">
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Width" value={resizeW} onChange={handleWChange} unit="px" />
          <InputField label="Height" value={resizeH} onChange={handleHChange} unit="px" />
        </div>
        <button
          onClick={() => setAspectLocked((l) => !l)}
          className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-medium transition-all duration-200"
          style={{
            borderColor: aspectLocked ? "var(--accent)" : "var(--border)",
            backgroundColor: aspectLocked ? "var(--accent-soft)" : "transparent",
            color: aspectLocked ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {aspectLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          {aspectLocked ? "Aspect Ratio Locked" : "Aspect Ratio Unlocked"}
        </button>
        {previewUrl && <ExportButton onClick={handleExport} label="Download Resized" />}
      </ToolCard>
    </ToolLayout>
  );
}
