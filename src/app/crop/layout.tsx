import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crop Image Online",
  description:
    "Free online image crop tool — trim, resize, and crop images with preset ratios (1:1, 4:3, 16:9) or free-form selection. 100% client-side, no uploads.",
  openGraph: {
    title: "Crop Image Online — Hydra1mage",
    description:
      "Free online image crop tool with interactive editor, preset ratios, and pixel-perfect precision.",
    url: "https://hydra1mage.vercel.app/crop",
    images: [
      {
        url: "/screenshots/crop.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Crop Image Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crop Image Online — Hydra1mage",
    description:
      "Free online image crop tool with interactive editor, preset ratios, and pixel-perfect precision.",
    images: ["/screenshots/crop.png"],
  },
  alternates: { canonical: "/crop" },
};

export default function CropLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
