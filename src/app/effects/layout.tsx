import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Effects & Filters",
  description:
    "Free online image effects — 15+ artistic filters including blur, sharpen, emboss, noise, vignette, grayscale, sepia, invert, threshold, duotone, posterize, edge detect, oil paint, and pixelate.",
  openGraph: {
    title: "Image Effects & Filters — Hydra1mage",
    description:
      "15+ artistic filters — blur, sharpen, emboss, noise, vignette, grayscale, sepia, and more.",
    url: "https://hydra1mage.vercel.app/effects",
    images: [
      {
        url: "/screenshots/effects.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Image Effects & Filters",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Effects & Filters — Hydra1mage",
    description:
      "15+ artistic filters — blur, sharpen, emboss, noise, vignette, grayscale, sepia, and more.",
    images: ["/screenshots/effects.png"],
  },
  alternates: { canonical: "/effects" },
};

export default function EffectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
