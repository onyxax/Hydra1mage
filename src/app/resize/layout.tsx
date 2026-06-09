import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resize Image Online",
  description:
    "Free online image resizer — scale images to any dimensions with locked or unlocked aspect ratio. Batch-friendly, instant results.",
  openGraph: {
    title: "Resize Image Online — Hydra1mage",
    description:
      "Free online image resizer with aspect ratio lock and custom dimensions.",
    url: "https://hydra1mage.vercel.app/resize",
    images: [
      {
        url: "/screenshots/home.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Resize Image Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resize Image Online — Hydra1mage",
    description:
      "Free online image resizer with aspect ratio lock and custom dimensions.",
    images: ["/screenshots/home.png"],
  },
  alternates: { canonical: "/resize" },
};

export default function ResizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
