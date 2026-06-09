"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";

interface CropEditorProps {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  aspectRatio?: number;
  onChange: (x: number, y: number, w: number, h: number) => void;
}

export interface CropEditorHandle {
  getCroppedCanvas: (opts?: { width?: number; height?: number; fillColor?: string }) => HTMLCanvasElement | null;
  getData: () => { x: number; y: number; width: number; height: number } | null;
}

interface CropperInstance {
  destroy: () => void;
  getData: () => { x: number; y: number; width: number; height: number };
  setData: (data: { x?: number; y?: number; width?: number; height?: number }) => void;
  setAspectRatio: (ratio: number) => void;
  getCroppedCanvas: (opts?: Record<string, unknown>) => HTMLCanvasElement | null;
}

declare global {
  interface Window {
    Cropper: new (el: HTMLImageElement, opts: Record<string, unknown>) => CropperInstance;
  }
}

const CROPPER_JS_URL = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js";
const CROPPER_CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css";

let cropperPromise: Promise<void> | null = null;

function loadCropper(): Promise<void> {
  if (cropperPromise) return cropperPromise;

  cropperPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"));
      return;
    }

    if (window.Cropper) {
      resolve();
      return;
    }

    if (!document.querySelector(`link[href="${CROPPER_CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CROPPER_CSS_URL;
      document.head.appendChild(link);
    }

    if (!document.querySelector(`script[src="${CROPPER_JS_URL}"]`)) {
      const script = document.createElement("script");
      script.src = CROPPER_JS_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Cropper.js from CDN"));
      document.head.appendChild(script);
    } else {
      const poll = setInterval(() => {
        if (window.Cropper) {
          clearInterval(poll);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(poll);
        reject(new Error("Timeout waiting for Cropper.js"));
      }, 8000);
    }
  });

  return cropperPromise;
}

const CropEditor = forwardRef<CropEditorHandle, CropEditorProps>(
  function CropEditor(
    { src, cropX, cropY, cropW, cropH, aspectRatio = NaN, onChange },
    ref
  ) {
    const imageRef = useRef<HTMLImageElement>(null);
    const cropperRef = useRef<CropperInstance | null>(null);
    const isReadyRef = useRef(false);
    const isUpdatingRef = useRef(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useImperativeHandle(ref, () => ({
      getCroppedCanvas(opts) {
        if (!cropperRef.current) return null;
        return cropperRef.current.getCroppedCanvas(opts as Record<string, unknown>);
      },
      getData() {
        if (!cropperRef.current) return null;
        const d = cropperRef.current.getData();
        return { x: Math.round(d.x), y: Math.round(d.y), width: Math.round(d.width), height: Math.round(d.height) };
      },
    }));

    useEffect(() => {
      let destroyed = false;

      loadCropper()
        .then(() => {
          if (destroyed || !imageRef.current || !window.Cropper) return;

          cropperRef.current = new window.Cropper(imageRef.current, {
            aspectRatio: NaN,
            viewMode: 1,
            background: false,
            autoCropArea: 1,
            crop() {
              if (isUpdatingRef.current || !cropperRef.current) return;
              const data = cropperRef.current.getData();
              onChangeRef.current(
                Math.round(data.x),
                Math.round(data.y),
                Math.round(data.width),
                Math.round(data.height)
              );
            },
            ready() {
              isReadyRef.current = true;
            },
          });
        })
        .catch(() => {});

      return () => {
        destroyed = true;
        isReadyRef.current = false;
        if (cropperRef.current) {
          cropperRef.current.destroy();
          cropperRef.current = null;
        }
      };
    }, [src]);

    useEffect(() => {
      if (!cropperRef.current || !isReadyRef.current) return;
      isUpdatingRef.current = true;
      cropperRef.current.setAspectRatio(aspectRatio);
      isUpdatingRef.current = false;
    }, [aspectRatio]);

    useEffect(() => {
      if (!cropperRef.current || !isReadyRef.current) return;
      const current = cropperRef.current.getData();
      const rx = Math.round(current.x);
      const ry = Math.round(current.y);
      const rw = Math.round(current.width);
      const rh = Math.round(current.height);
      if (rx === cropX && ry === cropY && rw === cropW && rh === cropH) return;

      isUpdatingRef.current = true;
      cropperRef.current.setData({ x: cropX, y: cropY, width: cropW, height: cropH });
      isUpdatingRef.current = false;
    }, [cropX, cropY, cropW, cropH]);

    return (
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 0,
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt="Crop preview"
          style={{ display: "block", maxWidth: "100%" }}
        />
      </div>
    );
  }
);

export default CropEditor;
