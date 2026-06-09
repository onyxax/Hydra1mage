import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeInit } from "@/components/ThemeInit";
import { ImageProvider } from "@/lib/image-context";
import TopBar from "@/components/TopBar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = "https://hydra1mage.vercel.app";
const SITE_NAME = "Hydra1mage";
const DESCRIPTION =
  "Free online image tools — crop, resize, compress, convert, rotate, flip, adjust, add effects, extract video thumbnails, and more. 100% client-side, no uploads, instant results.";

export const metadata: Metadata = {
  title: {
    default: "Hydra1mage — Free Online Image Tools | Crop, Resize, Convert & More",
    template: "%s | Hydra1mage",
  },
  description: DESCRIPTION,
  keywords: [
    "image tools",
    "online image editor",
    "crop image",
    "resize image",
    "compress image",
    "convert image",
    "png to ico",
    "png to jpg",
    "jpg to png",
    "webp to png",
    "rotate image",
    "flip image",
    "image effects",
    "image filters",
    "adjust brightness",
    "image info",
    "free image editor",
    "no upload image editor",
    "client-side image processing",
    "browser image tools",
    "smart compress",
    "image optimizer",
    "photo editor online",
    "image converter online",
    "transparent png",
    "remove background",
    "image compressor",
    "jpeg compressor",
    "png compressor",
    "batch image resize",
    "image resizer",
    "photo crop online",
    "oil paint effect",
    "grayscale image",
    "sepia filter",
    "pixelate image",
    "blur image",
    "sharpen image",
    "emboss effect",
    "edge detect",
    "image noise",
    "vignette effect",
    "posterize image",
    "duotone effect",
    "threshold image",
    "invert colors",
    "image metadata viewer",
    "exif viewer",
    "image dimensions",
    "file size checker",
    "youtube thumbnail extractor",
    "youtube thumbnail downloader",
    "video thumbnail grabber",
    "high resolution youtube thumbnail",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Hydra1mage — Free Online Image Tools",
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hydra1mage — Free Online Image Processing Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hydra1mage — Free Online Image Tools",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE",
  },
  other: {
    "application-name": SITE_NAME,
    "msapplication-TileColor": "#B8926A",
    "theme-color": "#B8926A",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: DESCRIPTION,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    isAccessibleForFree: true,
    codeRepository: "https://github.com/onyxax/Hydra1mage",
    author: {
      "@type": "Person",
      name: "onyxax",
      url: "https://guns.lol/onyxax",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Crop images",
      "Resize images",
      "Compress images (smart optimization)",
      "Convert between PNG, JPG, WEBP, GIF, BMP, ICO, TIFF, SVG, PDF",
      "Rotate images (any angle)",
      "Flip images (horizontal/vertical)",
      "Adjust brightness, contrast, saturation, hue, temperature, tint, gamma, sharpness",
      "Apply effects (blur, sharpen, emboss, noise, vignette, grayscale, sepia, invert, threshold, duotone, posterize, edge detect, oil paint, pixelate)",
      "Extract high-resolution YouTube video thumbnails",
      "View image info and metadata (EXIF, dimensions, file size, dominant colors)",
      "100% client-side processing — no server uploads",
      "Open source — contributions welcome",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeInit />
        <ImageProvider>
          <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
            <TopBar />
            <main className="mx-auto max-w-5xl px-8 pt-24 pb-16">
              {children}
            </main>
          </div>
        </ImageProvider>
      </body>
    </html>
  );
}
