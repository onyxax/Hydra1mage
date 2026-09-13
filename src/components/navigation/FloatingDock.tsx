"use client";

import { useState } from "react";
import { Undo2, Redo2, Copy, Check, Download, Trash2, Clock, History, X } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { useImageContext } from "@/lib/image-context";

export function FloatingDock() {
  const { imageFile, previewUrl, handleClearImage, canUndo, canRedo, handleUndo, handleRedo, handleJump, history, historyIndex } =
    useImageContext();
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleCopy = async () => {
    if (!previewUrl || !imageFile) return;
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      try {
        await navigator.clipboard.writeText(imageFile.name);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      } catch {}
    }
  };

  const handleDownload = () => {
    if (!previewUrl || !imageFile) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = imageFile.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const count = Math.max(0, history.length - 1);

  return (
    <div className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 xl:flex" style={{ gap: 12, alignItems: "flex-start" }}>
      {/* History panel — redesigned: cleaner timeline */}
      {showHistory && (
        <div
          className="flex max-h-[68vh] w-[300px] flex-col overflow-hidden rounded-[20px] border backdrop-blur-xl"
          style={{
            backgroundColor: "color-mix(in srgb, var(--bg-elevated) 96%, transparent)",
            borderColor: "var(--border)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.06) inset",
          }}
        >
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full border"
                style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
              >
                <History className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-bold tracking-[0.14em]" style={{ color: "var(--text-primary)" }}>
                HISTORY
              </span>
              <span
                className="rounded-full border px-2 py-0.5 text-[11px] font-bold leading-none"
                style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                {count}
              </span>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:border-[var(--border)]"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
              aria-label="Close history"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-px w-full" style={{ backgroundColor: "var(--border-subtle)" }} />

          {/* body */}
          <div className="flex-1 overflow-y-auto p-3">
            {count === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                  style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
                >
                  <Clock className="h-6 w-6 opacity-30" />
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    No history yet
                  </p>
                  <p className="mx-auto mt-1 max-w-[200px] text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Your edits will appear here as a timeline. Use Ctrl+Z and Ctrl+Y to travel.
                  </p>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="rounded-full border px-2 py-1 font-mono text-[10px]" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                    Ctrl+Z
                  </span>
                  <span className="rounded-full border px-2 py-1 font-mono text-[10px]" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                    Ctrl+Y
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col gap-2">
                {/* vertical line */}
                <div className="pointer-events-none absolute bottom-2 left-[15px] top-2 w-px" style={{ backgroundColor: "var(--border-subtle)" }} />
                {history.slice(1).map((h, idx) => {
                  const i = idx + 1;
                  const active = i === historyIndex;
                  return (
                    <button
                      key={h.id}
                      onClick={() => handleJump(i)}
                      className="group relative flex items-center gap-3 rounded-xl border py-2.5 pl-8 pr-3 text-left transition-colors"
                      style={{
                        backgroundColor: active ? "var(--accent)" : "var(--bg-elevated)",
                        borderColor: active ? "var(--accent)" : "var(--border-subtle)",
                      }}
                    >
                      {/* dot — no glow */}
                      <span
                        className="absolute left-2 top-1/2 flex h-3 w-3 -translate-y-1/2 items-center justify-center rounded-full border"
                        style={{
                          backgroundColor: active ? "white" : "var(--bg-secondary)",
                          borderColor: active ? "white" : "var(--border)",
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: active ? "var(--accent)" : "var(--text-muted)", opacity: active ? 1 : 0.5 }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-sm font-medium leading-none"
                          style={{ color: active ? "white" : "var(--text-primary)" }}
                        >
                          {h.file ? h.file.name.slice(0, 20) : "Cleared"}
                        </span>
                        <span
                          className="mt-1 flex items-center gap-1.5 text-[11px] leading-none"
                          style={{ color: active ? "rgba(255,255,255,0.85)" : "var(--text-muted)" }}
                        >
                          <span>{new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: active ? "rgba(255,255,255,0.6)" : "var(--border)" }} />
                          <span className="uppercase tracking-widest text-[10px] font-bold">{h.op}</span>
                        </span>
                      </span>
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold leading-none"
                        style={{
                          backgroundColor: active ? "rgba(255,255,255,0.18)" : "var(--bg-secondary)",
                          color: active ? "white" : "var(--text-muted)",
                          border: `1px solid ${active ? "rgba(255,255,255,0.25)" : "var(--border-subtle)"}`,
                        }}
                      >
                        {i}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* footer — minimal */}
          <div
            className="flex items-center justify-between border-t px-4 py-2.5"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-secondary)" }}
          >
            <span className="text-xs font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>
              {historyIndex} / {count} steps
            </span>
            <button
              onClick={() => setShowHistory(false)}
              className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Dock — 68px compact — organized spacing */}
      <div
        className="flex flex-col items-center rounded-[18px] border"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg-elevated) 96%, transparent)",
          borderColor: "var(--border)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.05) inset",
          width: 68,
          padding: 6,
          gap: 0,
          backdropFilter: "blur(16px)",
        }}
      >
        {/* status — compact */}
        <div className="flex w-full flex-col items-center gap-1 pb-2">
          <span
            className="h-1 w-5 rounded-full transition-colors"
            style={{
              backgroundColor: imageFile ? "var(--accent)" : "var(--border)",
              opacity: imageFile ? 1 : 0.35,
            }}
          />
          <span className="text-[8px] font-bold tracking-[0.18em]" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            {imageFile ? "READY" : "EMPTY"}
          </span>
        </div>

        <div className="h-px w-full opacity-60" style={{ backgroundColor: "var(--border-subtle)" }} />

        {/* HISTORY — organized: smaller buttons, balanced */}
        <div className="flex w-full flex-col gap-1.5 py-2.5">
          <div className="flex w-full justify-center">
            <span
              className="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[7px] font-bold tracking-[0.16em]"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
            >
              HISTORY
            </span>
          </div>
          <div className="grid w-full grid-cols-2 gap-1">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex h-7 items-center justify-center rounded-lg border transition-colors disabled:opacity-30"
              style={{
                backgroundColor: canUndo ? "var(--bg-elevated)" : "var(--bg-secondary)",
                borderColor: canUndo ? "var(--border)" : "var(--border-subtle)",
                color: canUndo ? "var(--text-primary)" : "var(--text-muted)",
              }}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 className="h-3 w-3" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex h-7 items-center justify-center rounded-lg border transition-colors disabled:opacity-30"
              style={{
                backgroundColor: canRedo ? "var(--bg-elevated)" : "var(--bg-secondary)",
                borderColor: canRedo ? "var(--border)" : "var(--border-subtle)",
                color: canRedo ? "var(--text-primary)" : "var(--text-muted)",
              }}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <Redo2 className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="relative flex h-6 w-full items-center justify-center gap-1 rounded-full border whitespace-nowrap px-2 text-[9px] font-bold transition-colors"
            style={{
              backgroundColor: showHistory ? "var(--accent)" : "var(--bg-elevated)",
              borderColor: showHistory ? "var(--accent)" : "var(--border)",
              color: showHistory ? "white" : "var(--text-muted)",
            }}
          >
            <Clock className="h-3 w-3 shrink-0" />
            <span>{showHistory ? "Hide" : "History"}</span>
            <span
              className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border px-0.5 text-[8px] font-bold leading-none tabular-nums"
              style={{
                backgroundColor: showHistory ? "white" : "var(--bg-elevated)",
                borderColor: showHistory ? "white" : "var(--border)",
                color: showHistory ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {count}
            </span>
          </button>
        </div>

        <div className="h-px w-full opacity-60" style={{ backgroundColor: "var(--border-subtle)" }} />

        {/* FILE — organized: Save prominent but not bulky, Copy/Clear lighter */}
        <div className="flex w-full flex-col gap-1 py-2.5">
          <div className="flex w-full justify-center">
            <span
              className="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[7px] font-bold tracking-[0.16em]"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
            >
              FILE
            </span>
          </div>
          <button
            onClick={handleDownload}
            disabled={!previewUrl}
            className="flex h-8 w-full items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-white transition-colors disabled:opacity-30 whitespace-nowrap"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            Save
          </button>
          <div className="flex w-full flex-col gap-1">
            <button
              onClick={handleCopy}
              disabled={!previewUrl}
              className="flex h-7 w-full items-center justify-center gap-1 rounded-lg border text-[10px] font-semibold transition-colors disabled:opacity-30 whitespace-nowrap"
              style={{
                backgroundColor: copied ? "rgba(34,197,94,0.10)" : "var(--bg-elevated)",
                borderColor: copied ? "rgba(34,197,94,0.28)" : "var(--border)",
                color: copied ? "#16a34a" : "var(--text-muted)",
              }}
              title={copied ? "Copied!" : "Copy"}
            >
              {copied ? <Check className="h-3 w-3 shrink-0" /> : <Copy className="h-3 w-3 shrink-0" />}
              {copied ? "Done" : "Copy"}
            </button>
            <button
              onClick={handleClearImage}
              disabled={!imageFile}
              className="flex h-7 w-full items-center justify-center gap-1 rounded-lg border text-[10px] font-semibold transition-colors disabled:opacity-30 hover:border-red-200 hover:text-red-500 whitespace-nowrap"
              style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}
              title="Clear"
            >
              <Trash2 className="h-3 w-3 shrink-0" />
              Clear
            </button>
          </div>
        </div>

        <div className="h-px w-full opacity-60" style={{ backgroundColor: "var(--border-subtle)" }} />

        {/* SOURCE — GitHub — compact prestigious */}
        <div className="flex w-full flex-col gap-1 py-2.5">
          <div className="flex w-full justify-center">
            <span
              className="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[7px] font-bold tracking-[0.16em]"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
            >
              SOURCE
            </span>
          </div>
          <a
            href="https://github.com/onyxax/Hydra1mage"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex w-full flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-colors hover:border-[var(--border)]"
            style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            title="View on GitHub"
            aria-label="GitHub"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full border"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </span>
            <span className="flex flex-col items-center leading-none">
              <span className="text-[11px] font-bold tracking-tight">GitHub</span>
              <span className="mt-0.5 text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>
                Open source
              </span>
            </span>
            <span
              className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border text-[8px] leading-none"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
            >
              ↗
            </span>
          </a>
        </div>

        <div className="h-px w-full opacity-60" style={{ backgroundColor: "var(--border-subtle)" }} />

        {/* SYSTEM — Theme — compact icon only */}
        <div className="flex w-full flex-col gap-1 pt-2.5">
          <div className="flex w-full justify-center">
            <span
              className="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[7px] font-bold tracking-[0.16em]"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
            >
              SYSTEM
            </span>
          </div>
          <div
            className="flex h-8 w-full items-center justify-center rounded-lg border"
            style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
