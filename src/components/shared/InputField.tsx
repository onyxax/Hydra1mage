"use client";

export function InputField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-bar py-3 text-xs"
          placeholder="0"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "var(--text-muted)" }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
