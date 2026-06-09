import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rotate Image Online",
  description:
    "Free online image rotator — rotate images to any angle with 90° presets or custom slider. Pixel-perfect precision.",
  openGraph: {
    title: "Rotate Image Online — Hydra1mage",
    description:
      "Free online image rotator — 90° presets or any custom angle.",
    url: "https://hydra1mage.vercel.app/rotate",
    images: [
      {
        url: "/screenshots/home.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Rotate Image Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rotate Image Online — Hydra1mage",
    description:
      "Free online image rotator — 90° presets or any custom angle.",
    images: ["/screenshots/home.png"],
  },
  alternates: { canonical: "/rotate" },
};

export default function RotateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
