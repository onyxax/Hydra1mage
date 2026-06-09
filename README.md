<p align="center">
  <img src="public/favicon.svg" width="100" height="100" alt="Hydra1mage Logo">
</p>

<h1 align="center">Hydra1mage</h1>

<p align="center">
  <strong>Free, open-source image processing suite — 100% client-side, zero uploads, instant results.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/PRs-Welcome-orange?style=flat-square" alt="PRs Welcome">
</p>

<p align="center">
  <a href="https://hydra1mage.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel" alt="Live Demo">
  </a>
  <a href="https://github.com/onyxax/Hydra1mage" target="_blank">
    <img src="https://img.shields.io/badge/Source_Code-GitHub-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
</p>

---

## About

Hydra1mage is a powerful, free online image editor that runs entirely in your browser. No server uploads, no sign-ups, no limits. Your images never leave your device — every operation happens locally using the Canvas API and modern Web Technologies.

**Key Philosophy:** Privacy-first image processing. What happens in your browser stays in your browser.

---

## Features

| Tool | Description |
|------|-------------|
| **Crop** | Interactive crop editor powered by Cropper.js — free-form or preset ratios (1:1, 4:3, 16:9) |
| **Resize** | Resize images with locked/unlocked aspect ratio — batch-friendly |
| **Smart Compress** | Auto-optimize file size with binary search — target specific KB or let AI decide |
| **Convert** | Convert between PNG, JPG, WebP, AVIF, GIF, BMP, TIFF, ICO, ICNS, SVG, PDF |
| **Rotate** | Rotate to any angle — 90° presets or custom slider (-180° to 180°) |
| **Flip** | Flip horizontally, vertically, or both |
| **Adjust** | Fine-tune exposure, temperature, tint, highlights, shadows, vibrance, gamma, sharpness |
| **Effects** | 15+ artistic filters — blur, grayscale, sepia, pixelate, emboss, vignette, duotone, oil paint, and more |
| **YouTube Thumbnail** | Extract high-resolution thumbnails from any YouTube video |
| **Image Info** | View EXIF metadata, dimensions, file size, and dominant color palette |

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **UI:** [React 19](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com)
- **Icons:** [Lucide React](https://lucide.dev)
- **Crop Engine:** [Cropper.js 1.5](https://cropperjs.github.io) (CDN)
- **Deployment:** [Vercel](https://vercel.com)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+ (recommended: 20)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/onyxax/Hydra1mage.git
cd Hydra1mage

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Project Structure

```
Hydra1mage/
├── public/
│   ├── favicon.svg          # App icon (earth-tone gradient)
│   ├── robots.txt           # SEO crawler rules
│   └── sitemap.xml          # Sitemap for search engines
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout, fonts, SEO, JSON-LD
│   │   ├── page.tsx         # Dashboard — tool card grid
│   │   ├── globals.css      # Theme, components, scrollbar, slider
│   │   ├── crop/            # Crop tool page
│   │   ├── resize/          # Resize tool page
│   │   ├── compress/        # Smart compress page
│   │   ├── convert/         # Format converter page
│   │   ├── rotate/          # Rotate tool page
│   │   ├── flip/            # Flip tool page
│   │   ├── adjust/          # Image adjustment page
│   │   ├── effects/         # Artistic effects page
│   │   ├── extract-thumbnail/ # YouTube thumbnail extractor
│   │   └── info/            # Image metadata viewer
│   ├── components/
│   │   ├── TopBar.tsx       # Navigation header
│   │   ├── DropZone.tsx     # File upload drop zone
│   │   ├── CropEditor.tsx   # Cropper.js wrapper
│   │   ├── CanvasPreview.tsx # Live canvas preview
│   │   ├── ToolCard.tsx     # Reusable card component
│   │   ├── ThemeToggle.tsx  # Dark/light mode toggle
│   │   ├── tools/           # Tool-specific components
│   │   └── shared/          # Shared UI components
│   └── lib/
│       ├── image-context.tsx # React Context for image state
│       └── image-utils.ts   # Canvas processing functions
├── vercel.json              # Vercel deployment config
├── tsconfig.json            # TypeScript configuration
├── eslint.config.mjs        # ESLint configuration
└── postcss.config.mjs       # PostCSS (Tailwind)
```

---

## Key Features

### Privacy First
All image processing happens in your browser using the Canvas API. No data is sent to any server. Your images never leave your device.

### Smart Compress
Upload an image and let Hydra1mage automatically optimize it. Set a target file size in KB, or let the algorithm find the best quality-to-size ratio using binary search.

### 11 Format Conversion
Convert between PNG, JPG, WebP, AVIF, GIF, BMP, TIFF, ICO, ICNS, SVG, and PDF — all client-side.

### Dark & Light Theme
Automatic theme detection with manual toggle. Earth-tone color palette designed for comfort during long editing sessions.

### SEO Optimized
JSON-LD structured data, Open Graph tags, per-route metadata, robots.txt, and sitemap.xml — ready for Google indexing.

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Author

**onyxax** — [@onyxax](https://guns.lol/onyxax)

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with care by the open-source community
</p>
