"use client";

// Deep module: single source for tool page headings.
// Previously each tool copy-pasted the same <h1> + <p> with inline styles
// (CropPage, EffectsTool, AdjustTool, RotateTool, FlipTool, ToolLayout).
// Centralizing avoids drift and makes future theming one edit.
export function ToolHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1
        className="text-2xl font-light tracking-tight sm:text-3xl"
        style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
      >
        {title}
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        {subtitle}
      </p>
    </div>
  );
}
