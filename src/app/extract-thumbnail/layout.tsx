import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Thumbnail Extractor",
  description:
    "Free YouTube thumbnail downloader — extract high-resolution thumbnails from any YouTube video URL. Supports all thumbnail qualities. 100% client-side.",
  openGraph: {
    title: "YouTube Thumbnail Extractor — Hydra1mage",
    description:
      "Extract high-resolution thumbnails from any YouTube video URL. No sign-up required.",
    url: "https://hydra1mage.vercel.app/extract-thumbnail",
    images: [
      {
        url: "/screenshots/home.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — YouTube Thumbnail Extractor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Thumbnail Extractor — Hydra1mage",
    description:
      "Extract high-resolution thumbnails from any YouTube video URL. No sign-up required.",
    images: ["/screenshots/home.png"],
  },
  alternates: { canonical: "/extract-thumbnail" },
};

export default function ExtractThumbnailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
