import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adjust Image — Brightness, Contrast & More",
  description:
    "Free online image adjustment tool — fine-tune exposure, temperature, tint, highlights, shadows, vibrance, gamma, and sharpness. Full resolution preview.",
  openGraph: {
    title: "Adjust Image — Brightness, Contrast & More — Hydra1mage",
    description:
      "Fine-tune exposure, temperature, tint, highlights, shadows, vibrance, gamma, and sharpness.",
    url: "https://hydra1mage.vercel.app/adjust",
    images: [
      {
        url: "/screenshots/adjust.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Image Adjustment Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adjust Image — Brightness, Contrast & More — Hydra1mage",
    description:
      "Fine-tune exposure, temperature, tint, highlights, shadows, vibrance, gamma, and sharpness.",
    images: ["/screenshots/adjust.png"],
  },
  alternates: { canonical: "/adjust" },
};

export default function AdjustLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
