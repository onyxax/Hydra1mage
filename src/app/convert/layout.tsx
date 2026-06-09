import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convert Image Format",
  description:
    "Free online image format converter — convert between PNG, JPG, WebP, AVIF, GIF, BMP, TIFF, ICO, ICNS, SVG, and PDF. 100% client-side.",
  openGraph: {
    title: "Convert Image Format — Hydra1mage",
    description:
      "Free online image converter — PNG, JPG, WebP, AVIF, GIF, BMP, TIFF, ICO, ICNS, SVG, PDF.",
    url: "https://hydra1mage.vercel.app/convert",
    images: [
      {
        url: "/screenshots/convert.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Image Format Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Convert Image Format — Hydra1mage",
    description:
      "Free online image converter — PNG, JPG, WebP, AVIF, GIF, BMP, TIFF, ICO, ICNS, SVG, PDF.",
    images: ["/screenshots/convert.png"],
  },
  alternates: { canonical: "/convert" },
};

export default function ConvertLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
