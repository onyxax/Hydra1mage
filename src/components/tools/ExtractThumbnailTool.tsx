"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Video,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";
import ToolCard from "@/components/ToolCard";
import CanvasPreview from "@/components/CanvasPreview";
import {
  loadImage,
  downloadBlob,
  getExtensionFromMime,
} from "@/lib/image-utils";
import type { ToolProps } from "./RotateTool";

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

const THUMBNAIL_QUALITIES = [
  "maxresdefault.jpg",
  "sddefault.jpg",
  "hqdefault.jpg",
  "mqdefault.jpg",
] as const;

function extractYouTubeId(url: string): string | null {
  const match = url.trim().match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

function getYouTubeThumbnailUrls(videoId: string): string[] {
  return THUMBNAIL_QUALITIES.map(
    (q) => `https://img.youtube.com/vi/${videoId}/${q}`
  );
}

type Status = "idle" | "loading" | "success" | "error";

export default function ExtractThumbnailTool({ onFileSelect }: ToolProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
    };
  }, [thumbPreviewUrl]);

  const extractThumbnail = useCallback(async () => {
    const videoId = extractYouTubeId(url);

    if (!videoId) {
      setStatus("error");
      setErrorMsg(
        "Invalid YouTube URL. Paste a link like youtube.com/watch?v=... or youtu.be/..."
      );
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStatus("loading");
    setErrorMsg("");
    setThumbPreviewUrl(null);

    try {
      const urls = getYouTubeThumbnailUrls(videoId);
      let fetched = false;

      for (const tryUrl of urls) {
        try {
          const res = await fetch(tryUrl, { signal: abortRef.current.signal });
          if (res.ok) {
            const blob = await res.blob();
            if (blob.size > 1000) {
              const objectUrl = URL.createObjectURL(blob);
              setThumbPreviewUrl(objectUrl);
              setStatus("success");
              fetched = true;
              break;
            }
          }
        } catch {
          continue;
        }
      }

      if (!fetched) {
        setStatus("error");
        setErrorMsg(
          "Could not fetch YouTube thumbnail. The video may be private or unavailable."
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Extraction failed");
    }
  }, [url]);

  const handleLoadIntoWorkspace = useCallback(async () => {
    if (!thumbPreviewUrl) return;
    try {
      const img = await loadImage(thumbPreviewUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "thumbnail_youtube.jpg", {
            type: "image/jpeg",
          });
          onFileSelect(file);
        }
      }, "image/jpeg", 0.95);
    } catch {
      setStatus("error");
      setErrorMsg("Failed to process thumbnail");
    }
  }, [thumbPreviewUrl, onFileSelect]);

  const handleDownload = useCallback(async () => {
    if (!thumbPreviewUrl) return;
    try {
      const img = await loadImage(thumbPreviewUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const ext = getExtensionFromMime(blob.type);
          downloadBlob(blob, `thumbnail.${ext}`);
        }
      }, "image/png");
    } catch {
      setStatus("error");
      setErrorMsg("Failed to download thumbnail");
    }
  }, [thumbPreviewUrl]);

  const drawPreview = useCallback(
    (
      img: HTMLImageElement,
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D
    ) => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    },
    []
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-4">
      {thumbPreviewUrl && (
        <CanvasPreview previewUrl={thumbPreviewUrl} draw={drawPreview} />
      )}

      <ToolCard title="YouTube URL" icon={Video} zone="Extraction">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <LinkIcon
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && url.trim()) extractThumbnail();
              }}
              placeholder="Paste YouTube video link here..."
              className="input-bar py-3 pl-10 text-xs"
            />
          </div>

          <button
            onClick={extractThumbnail}
            disabled={!url.trim() || status === "loading"}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Extract Thumbnail
              </>
            )}
          </button>

          {status === "error" && errorMsg && (
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                color: "#ef4444",
              }}
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === "success" && (
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.08)",
                color: "#22c55e",
              }}
            >
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Thumbnail extracted from YouTube.</span>
            </div>
          )}
        </div>
      </ToolCard>

      {status === "success" && thumbPreviewUrl && (
        <ToolCard title="Actions" icon={Video} zone="Export">
          <div className="flex flex-col gap-2">
            <button
              onClick={handleLoadIntoWorkspace}
              className="btn-primary flex items-center gap-2"
            >
              <Video className="h-4 w-4" />
              Load into Workspace
            </button>
            <button
              onClick={handleDownload}
              className="btn-ghost flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Thumbnail
            </button>
          </div>
        </ToolCard>
      )}
    </div>
  );
}
