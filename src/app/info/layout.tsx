import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Info & Metadata Viewer",
  description:
    "Free online image metadata viewer — view EXIF data, dimensions, file size, color profile, and dominant color palette. Instant analysis.",
  openGraph: {
    title: "Image Info & Metadata Viewer — Hydra1mage",
    description:
      "View EXIF data, dimensions, file size, and dominant color palette. Instant analysis.",
    url: "https://hydra1mage.vercel.app/info",
    images: [
      {
        url: "/screenshots/home.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Image Info & Metadata Viewer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Info & Metadata Viewer — Hydra1mage",
    description:
      "View EXIF data, dimensions, file size, and dominant color palette. Instant analysis.",
    images: ["/screenshots/home.png"],
  },
  alternates: { canonical: "/info" },
};

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
