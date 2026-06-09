"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface ImageContextValue {
  imageFile: File | null;
  previewUrl: string | null;
  handleFileSelect: (file: File) => void;
  handleClearImage: () => void;
}

const ImageContext = createContext<ImageContextValue | null>(null);

export function ImageProvider({ children }: { children: ReactNode }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile((prev) => {
      if (prev) URL.revokeObjectURL(URL.createObjectURL(prev));
      return file;
    });
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  const handleClearImage = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  return (
    <ImageContext.Provider value={{ imageFile: selectedFile, previewUrl, handleFileSelect, handleClearImage }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImageContext() {
  const ctx = useContext(ImageContext);
  if (!ctx) throw new Error("useImageContext must be used within ImageProvider");
  return ctx;
}
