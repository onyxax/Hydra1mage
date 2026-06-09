import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flip Image Online",
  description:
    "Free online image flipper — flip images horizontally, vertically, or both. Instant preview, no uploads.",
  openGraph: {
    title: "Flip Image Online — Hydra1mage",
    description:
      "Free online image flipper — horizontal, vertical, or both.",
    url: "https://hydra1mage.vercel.app/flip",
    images: [
      {
        url: "/screenshots/home.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Flip Image Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flip Image Online — Hydra1mage",
    description:
      "Free online image flipper — horizontal, vertical, or both.",
    images: ["/screenshots/home.png"],
  },
  alternates: { canonical: "/flip" },
};

export default function FlipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
