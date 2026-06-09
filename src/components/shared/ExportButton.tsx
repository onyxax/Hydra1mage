"use client";

import { Download } from "lucide-react";

export function ExportButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn-primary flex items-center gap-2">
      <Download className="h-4 w-4" />
      {label || "Export Image"}
    </button>
  );
}
