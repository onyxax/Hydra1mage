import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Image Compressor",
  description:
    "Free smart image compressor — auto-optimize file size with binary search. Target a specific KB or let the algorithm find the best quality-to-size ratio.",
  openGraph: {
    title: "Smart Image Compressor — Hydra1mage",
    description:
      "Free smart image compressor with binary search optimization for the best quality-to-size ratio.",
    url: "https://hydra1mage.vercel.app/compress",
    images: [
      {
        url: "/screenshots/home.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Smart Image Compressor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Image Compressor — Hydra1mage",
    description:
      "Free smart image compressor with binary search optimization for the best quality-to-size ratio.",
    images: ["/screenshots/home.png"],
  },
  alternates: { canonical: "/compress" },
};

export default function CompressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
