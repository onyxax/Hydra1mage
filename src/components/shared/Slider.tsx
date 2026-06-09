"use client";

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full"
        style={{ backgroundColor: "var(--border)" }}
      />
    </div>
  );
}
