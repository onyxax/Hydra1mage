"use client";

export function HydraLogo({ size = 20, gradientId = "hydra-grad" }: { size?: number; gradientId?: string }) {
  return (
    <svg className="shrink-0" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A67A" />
          <stop offset="100%" stopColor="#A07D58" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <g transform="translate(16,16)">
        <rect x="-6" y="-6" width="12" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.8" opacity="0.9" />
        <rect x="-3" y="-3" width="6" height="6" rx="1" fill="white" opacity="0.9" />
        <line x1="6" y1="-6" x2="9" y2="-9" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
        <line x1="-6" y1="6" x2="-9" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      </g>
    </svg>
  );
}
