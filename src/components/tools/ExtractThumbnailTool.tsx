"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Video, Link as LinkIcon, Loader2, AlertCircle, Download, Copy, ExternalLink, Sparkles, Play } from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { loadImage, downloadBlob, getExtensionFromMime } from "@/lib/image";
import type { ToolProps } from "./RotateTool";

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

const QUALITIES = [
  { id: "maxresdefault.jpg", label: "HD", sub: "1280×720", badge: "Best" },
  { id: "sddefault.jpg", label: "SD", sub: "640×480", badge: "SD" },
  { id: "hqdefault.jpg", label: "HQ", sub: "480×360", badge: "HQ" },
  { id: "mqdefault.jpg", label: "MQ", sub: "320×180", badge: "MQ" },
] as const;

function extractYouTubeId(url: string): string | null {
  const m = url.trim().match(YOUTUBE_REGEX);
  return m ? m[1] : null;
}

export default function ExtractThumbnailTool({ onFileSelect }: ToolProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [activeQ, setActiveQ] = useState<string>("maxresdefault.jpg");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [thumbUrl]);

  const extract = useCallback(
    async (q = activeQ) => {
      const id = extractYouTubeId(url);
      if (!id) {
        setStatus("error");
        setErrorMsg("That doesn't look like a YouTube link. Try youtube.com/watch?v=... or youtu.be/...");
        return;
      }
      setVideoId(id);
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setStatus("loading");
      setErrorMsg("");
      setThumbUrl(null);
      try {
        const order = [q, ...QUALITIES.map((x) => x.id).filter((x) => x !== q)];
        for (const qual of order) {
          try {
            const r = await fetch(`https://img.youtube.com/vi/${id}/${qual}`, { signal: abortRef.current.signal });
            if (r.ok) {
              const b = await r.blob();
              if (b.size > 1000) {
                const u = URL.createObjectURL(b);
                setThumbUrl(u);
                setActiveQ(qual);
                setStatus("success");
                return;
              }
            }
          } catch {}
        }
        setStatus("error");
        setErrorMsg("No thumbnail found — video may be private or removed.");
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return;
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : "Failed");
      }
    },
    [url, activeQ]
  );

  const onCopy = async () => {
    if (!videoId) return;
    await navigator.clipboard.writeText(`https://img.youtube.com/vi/${videoId}/${activeQ}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onDownload = useCallback(async () => {
    if (!thumbUrl) return;
    const img = await loadImage(thumbUrl);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
    c.toBlob((b) => {
      if (b) downloadBlob(b, `thumbnail_${videoId}.${getExtensionFromMime(b.type)}`);
    }, "image/png");
  }, [thumbUrl, videoId]);

  const onEdit = useCallback(async () => {
    if (!thumbUrl) return;
    const img = await loadImage(thumbUrl);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
    c.toBlob((b) => {
      if (b) onFileSelect(new File([b], `thumbnail_${videoId}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.95);
  }, [thumbUrl, onFileSelect, videoId]);

  const valid = !!extractYouTubeId(url);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <ToolHeader title="YouTube Thumbnail" subtitle="Paste any YouTube link — get the cover in full resolution" />

      {/* — Hero Input — */}
      <div className="relative overflow-hidden rounded-2xl border p-4 sm:p-6" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest" style={{ color: "var(--accent)" }}>
            <Video className="h-3.5 w-3.5" /> YOUTUBE LINK
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: valid ? "var(--accent)" : "var(--text-muted)" }} />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && url.trim() && extract()}
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full rounded-xl border py-3.5 pl-10 pr-3 text-sm outline-none transition-all"
                style={{ backgroundColor: "var(--bg-primary)", borderColor: valid ? "var(--accent)" : "var(--border)", color: "var(--text-primary)", boxShadow: valid ? "0 0 0 3px var(--accent-soft)" : "none" }}
                autoFocus
              />
            </div>
            <button
              onClick={() => extract()}
              disabled={!url.trim() || status === "loading"}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Extracting…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Extract
                </>
              )}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span>Try:</span>
            {["youtu.be/...", "youtube.com/shorts/...", "youtube.com/embed/..."].map((ex) => (
              <span key={ex} className="rounded-full border px-2 py-0.5" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                {ex}
              </span>
            ))}
          </div>
          {status === "error" && errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs" style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)", color: "#b91c1c" }}>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* — Preview — */}
      {thumbUrl ? (
        <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-lg)" }}>
          <div className="relative bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl} alt="thumbnail" className="block max-h-[560px] w-full object-contain" draggable={false} />
            <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-3">
              <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white backdrop-blur">THUMBNAIL</span>
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-zinc-800 shadow">{activeQ.replace(".jpg", "")} • {QUALITIES.find((q) => q.id === activeQ)?.sub}</span>
            </div>
            <a
              href={`https://youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 shadow-lg transition-transform hover:scale-105"
            >
              <Play className="h-3.5 w-3.5 fill-black" /> Watch on YouTube
            </a>
          </div>
          {/* Quality strip */}
          <div className="flex gap-2 overflow-x-auto p-3" style={{ backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)" }}>
            {QUALITIES.map((q) => {
              const active = q.id === activeQ;
              return (
                <button
                  key={q.id}
                  onClick={() => extract(q.id)}
                  className="group relative flex shrink-0 flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all"
                  style={{
                    backgroundColor: active ? "var(--bg-elevated)" : "var(--bg-elevated)",
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    boxShadow: active ? "0 0 0 2px var(--accent-soft)" : "none",
                    minWidth: 110,
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                    {q.label}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {q.sub}
                  </span>
                  {active && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />}
                </button>
              );
            })}
            <div className="ml-auto hidden items-center gap-2 self-center pl-2 sm:flex">
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Tap to switch quality
              </span>
            </div>
          </div>
          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 p-3" style={{ backgroundColor: "var(--bg-elevated)", borderTop: "1px solid var(--border-subtle)" }}>
            <button onClick={onDownload} className="flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white" style={{ backgroundColor: "var(--accent)" }}>
              <Download className="h-4 w-4" /> Download
            </button>
            <button onClick={onEdit} className="flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
              Edit in Hydra1mage
            </button>
            <button
              onClick={onCopy}
              className="flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-medium"
              style={{ backgroundColor: copied ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)", borderColor: copied ? "rgba(34,197,94,0.3)" : "var(--border)", color: copied ? "#16a34a" : "var(--text-muted)" }}
            >
              <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <Video className="h-6 w-6" style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            No thumbnail yet
          </p>
          <p className="mt-1 max-w-sm text-xs" style={{ color: "var(--text-muted)" }}>
            Paste any YouTube link above — shorts, youtu.be, embed, or watch — and get every available quality instantly.
          </p>
        </div>
      )}
    </div>
  );
}
