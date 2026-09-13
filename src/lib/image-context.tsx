"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { ImageHistory } from "./image/history";

interface ImageContextValue {
  imageFile: File | null;
  previewUrl: string | null;
  handleFileSelect: (file: File) => void;
  handleClearImage: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
  handleJump: (idx: number) => void;
  history: ReadonlyArray<{ id: string; file: File | null; url: string | null; op: string; ts: number }>;
  historyLength: number;
  historyIndex: number;
}

const ImageContext = createContext<ImageContextValue | null>(null);

export function ImageProvider({ children }: { children: ReactNode }) {
  const historyRef = useRef<ImageHistory | null>(null);
  if (!historyRef.current) historyRef.current = new ImageHistory();
  const history = historyRef.current;

  const [, force] = useState(0);
  const rerender = useCallback(() => force((v) => v + 1), []);

  // Subscribe to history changes via polling? Instead, we make handlers update state and force rerender
  const handleFileSelect = useCallback(
    (file: File) => {
      history.push(file, "select");
      rerender();
    },
    [history, rerender]
  );

  const handleClearImage = useCallback(() => {
    history.push(null, "clear");
    rerender();
  }, [history, rerender]);

  const handleUndo = useCallback(() => {
    if (history.canUndo) {
      history.undo();
      rerender();
    }
  }, [history, rerender]);

  const handleRedo = useCallback(() => {
    if (history.canRedo) {
      history.redo();
      rerender();
    }
  }, [history, rerender]);

  const handleJump = useCallback(
    (idx: number) => {
      history.jump(idx);
      rerender();
    },
    [history, rerender]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        if (history.canUndo) {
          history.undo();
          rerender();
        }
      } else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        if (history.canRedo) {
          history.redo();
          rerender();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, rerender]);

  useEffect(() => {
    return () => history.destroy();
  }, [history]);

  const current = history.current;

  return (
    <ImageContext.Provider
      value={{
        imageFile: current.file,
        previewUrl: current.url,
        handleFileSelect,
        handleClearImage,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        handleUndo,
        handleRedo,
        handleJump,
        history: history.all,
        historyLength: history.length,
        historyIndex: history.index,
      }}
    >
      {children}
    </ImageContext.Provider>
  );
}

export function useImageContext() {
  const ctx = useContext(ImageContext);
  if (!ctx) throw new Error("useImageContext must be used within ImageProvider");
  return ctx;
}
