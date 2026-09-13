import { describe, it, expect, vi } from "vitest";
import { getImageInfo } from "@/lib/image/info";
import * as core from "@/lib/image/core";

// Assumptions for getImageInfo:
// - Computes dimensions, aspectRatio via gcd, megapixels, bitsPerPixel
// - Samples to 100px max for performance
// - Computes dominantColors (5), hasAlpha, averageBrightness, fileSizeCategory, orientation, colorSpace

describe("info — getImageInfo", () => {
  function mockLoadImage(w: number, h: number) {
    vi.spyOn(core, "loadImage").mockResolvedValue({ naturalWidth: w, naturalHeight: h } as HTMLImageElement);
  }

  function mockCanvasSample(varied = false) {
    const fakeData = new Uint8ClampedArray(100 * 50 * 4);
    // Fill with red pixels with varying alpha to test hasAlpha
    // If varied, cycle 5 distinct quantized colors to ensure 5 dominant buckets
    const palette = varied
      ? [
          [220, 20, 20],
          [20, 220, 20],
          [20, 20, 220],
          [220, 220, 20],
          [220, 20, 220],
          [20, 220, 220],
        ]
      : null;
    for (let i = 0; i < fakeData.length; i += 4) {
      if (varied && palette) {
        const c = palette[(i / 4) % palette.length | 0];
        fakeData[i] = c[0];
        fakeData[i + 1] = c[1];
        fakeData[i + 2] = c[2];
      } else {
        fakeData[i] = 200; // R
        fakeData[i + 1] = 100; // G
        fakeData[i + 2] = 50; // B
      }
      fakeData[i + 3] = i % 8 === 0 ? 100 : 255; // occasional transparent
    }
    const ctx = {
      drawImage: () => {},
      getImageData: () => ({ data: fakeData, width: 100, height: 50 }),
    } as unknown as CanvasRenderingContext2D;
    const canvas = { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
    const origCreate = document.createElement.bind(document);
    const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") return canvas as never;
      return origCreate(tag as never) as never;
    });
    return spy;
  }

  it("computes dimensions, aspectRatio, megapixels, orientation (assumption: gcd)", async () => {
    mockLoadImage(400, 200);
    const spy = mockCanvasSample();
    const file = new File([new Uint8Array(50000)], "photo.jpg", { type: "image/jpeg", lastModified: Date.now() });
    const info = await getImageInfo(file, "blob:mock");
    expect(info.width).toBe(400);
    expect(info.height).toBe(200);
    expect(info.aspectRatio).toBe("2:1"); // gcd 200
    expect(info.megapixels).toBe(0.08);
    expect(info.orientation).toBe("landscape");
    spy.mockRestore();
    vi.restoreAllMocks();
  });

  it("handles square and portrait orientation", async () => {
    for (const [w, h, orient] of [
      [100, 100, "square"],
      [200, 400, "portrait"],
    ] as const) {
      mockLoadImage(w, h);
      const spy = mockCanvasSample();
      const file = new File([""], "a.png", { type: "image/png" });
      const info = await getImageInfo(file, "blob:mock");
      expect(info.orientation).toBe(orient);
      spy.mockRestore();
      vi.restoreAllMocks();
    }
  });

  it("detects hasAlpha when any pixel alpha <255 (assumption: sampling)", async () => {
    mockLoadImage(100, 100);
    const spy = mockCanvasSample(); // our mock has semi-transparent pixels
    const file = new File([""], "a.png", { type: "image/png" });
    const info = await getImageInfo(file, "blob:mock");
    expect(info.hasAlpha).toBe(true);
    spy.mockRestore();
    vi.restoreAllMocks();
  });

  it("computes fileSizeCategory thresholds (assumption: tiny <10k, small <100k, medium <1M, large <10M)", async () => {
    mockLoadImage(10, 10);
    const cases: Array<[number, string]> = [
      [5000, "tiny"],
      [50000, "small"],
      [500000, "medium"],
      [5000000, "large"],
      [20000000, "huge"],
    ];
    for (const [size, cat] of cases) {
      const spy = mockCanvasSample();
      const file = new File([new Uint8Array(size)], "a.jpg", { type: "image/jpeg" });
      const info = await getImageInfo(file, "blob:mock");
      expect(info.fileSizeCategory).toBe(cat);
      spy.mockRestore();
      vi.restoreAllMocks();
      mockLoadImage(10, 10);
    }
  });

  it("maps mime to colorSpace (assumption: mimeToSpace table)", async () => {
    mockLoadImage(10, 10);
    const spy = mockCanvasSample();
    const pngFile = new File([""], "a.png", { type: "image/png" });
    const jpegFile = new File([""], "a.jpg", { type: "image/jpeg" });
    const unknownFile = new File([""], "a.xyz", { type: "image/xyz" });
    expect((await getImageInfo(pngFile, "blob:mock")).colorSpace).toBe("sRGB (lossless)");
    vi.restoreAllMocks(); mockLoadImage(10, 10); const spy2 = mockCanvasSample();
    expect((await getImageInfo(jpegFile, "blob:mock")).colorSpace).toBe("sRGB (lossy)");
    spy2.mockRestore(); vi.restoreAllMocks(); mockLoadImage(10, 10); const spy3 = mockCanvasSample();
    expect((await getImageInfo(unknownFile, "blob:mock")).colorSpace).toBe("Unknown");
    spy.mockRestore(); spy3.mockRestore();
    vi.restoreAllMocks();
  });

  it("computes dominantColors 5 and averageBrightness 0-1 (assumption: bucketed)", async () => {
    mockLoadImage(100, 100);
    const spy = mockCanvasSample(true);
    const file = new File([""], "a.jpg", { type: "image/jpeg" });
    const info = await getImageInfo(file, "blob:mock");
    expect(info.dominantColors).toHaveLength(5);
    expect(info.averageBrightness).toBeGreaterThanOrEqual(0);
    expect(info.averageBrightness).toBeLessThanOrEqual(1);
    spy.mockRestore();
    vi.restoreAllMocks();
  });
});
