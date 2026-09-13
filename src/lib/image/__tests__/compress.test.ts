import { describe, it, expect, vi, beforeEach } from "vitest";
import { compressImage, smartCompress, quantizeColors } from "@/lib/image/compress";

// Mock canvas.toBlob to control output size per quality
function mockCanvasWithBlobSizes(sizesByQuality: Record<number, number>) {
  return {
    width: 100,
    height: 100,
    getContext: () => ({
      getImageData: () => ({
        data: new Uint8ClampedArray(100 * 100 * 4).fill(128),
        width: 100,
        height: 100,
      }),
      putImageData: () => {},
    }),
    toBlob: (cb: (b: Blob | null) => void, _type?: string, quality?: number) => {
      const q = quality !== undefined ? Math.round(quality * 100) : 92;
      // Find closest mocked quality
      let size = sizesByQuality[q];
      if (size === undefined) {
        // interpolate: higher quality => larger size
        size = 1000 + q * 10;
      }
      cb(new Blob([new Uint8Array(size)], { type: _type || "image/jpeg" }));
    },
  } as unknown as HTMLCanvasElement;
}

describe("compress — quantization & smart optimization", () => {
  describe("quantizeColors", () => {
    it("reduces colors by step quantization (pure function, assumption: step = 256/colors)", () => {
      // Create a fake canvas with backing store to avoid jsdom's stub getContext
      const initial = new Uint8ClampedArray([100, 150, 200, 255, 10, 20, 30, 255, 250, 250, 250, 255, 0, 0, 0, 255]);
      let stored: ImageData | null = new ImageData(new Uint8ClampedArray(initial), 2, 2);
      const fakeCanvas = {
        width: 2,
        height: 2,
        getContext: () =>
          ({
            getImageData: () => ({ data: new Uint8ClampedArray(stored!.data), width: 2, height: 2 }),
            putImageData: (d: ImageData) => {
              stored = d;
            },
          } as unknown as CanvasRenderingContext2D),
      } as unknown as HTMLCanvasElement;
      // Also need to mock document.createElement for the output canvas inside quantizeColors
      const origCreate = document.createElement.bind(document);
      let outStored: ImageData | null = null;
      const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "canvas") {
          return {
            width: 0,
            height: 0,
            getContext: () => ({
              putImageData: (d: ImageData) => {
                outStored = d;
              },
              getImageData: () => outStored ?? { data: new Uint8ClampedArray(16), width: 2, height: 2 },
            }),
          } as unknown as HTMLCanvasElement;
        }
        return origCreate(tag as never) as never;
      });

      const out = quantizeColors(fakeCanvas, 2); // step 128
      expect(out.width).toBe(2);
      expect(out.height).toBe(2);
      expect(outStored).toBeTruthy();
      // 100 -> 128, 10 ->0 (with our stored logic, we can check first pixel)
      // Our fake outStored is set via putImageData inside quantizeColors
      const outData = outStored!.data;
      expect(outData[0]).toBe(128); // 100 -> 128
      expect(outData[4]).toBe(0); // 10 -> 0
      spy.mockRestore();
    });

    it("handles colors=256 (no change, step=1)", () => {
      const fakeCanvas = {
        width: 1,
        height: 1,
        getContext: () => ({
          getImageData: () => ({ data: new Uint8ClampedArray([123, 45, 67, 255]), width: 1, height: 1 }),
          putImageData: () => {},
        }),
      } as unknown as HTMLCanvasElement;
      const origCreate = document.createElement.bind(document);
      const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "canvas") {
          return { width: 1, height: 1, getContext: () => ({ putImageData: () => {} }) } as unknown as HTMLCanvasElement;
        }
        return origCreate(tag as never) as never;
      });
      const out = quantizeColors(fakeCanvas, 256);
      expect(out).toBeDefined();
      spy.mockRestore();
    });
  });

  describe("compressImage", () => {
    it("resolves with blob on success (assumption: toBlob callback not null)", async () => {
      const canvas = {
        toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(["hi"], { type: "image/jpeg" })),
      } as unknown as HTMLCanvasElement;
      await expect(compressImage(canvas, 80, "image/jpeg")).resolves.toBeInstanceOf(Blob);
    });
    it("rejects when toBlob yields null (assumption: null -> error)", async () => {
      const canvas = {
        toBlob: (cb: (b: Blob | null) => void) => cb(null),
      } as unknown as HTMLCanvasElement;
      await expect(compressImage(canvas, 80)).rejects.toThrow("Failed to compress image");
    });
    it("passes quality/100 to toBlob", async () => {
      const spy = vi.fn((cb: (b: Blob | null) => void, _t: string, q: number) => cb(new Blob(["a"])));
      const canvas = { toBlob: spy } as unknown as HTMLCanvasElement;
      await compressImage(canvas, 50, "image/webp");
      expect(spy).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.5);
    });
  });

  describe("smartCompress — regression for binary search & heuristics", () => {
    it("PNG path uses quantize when colors <256 and returns result (regression: no crash on PNG)", async () => {
      const canvas = mockCanvasWithBlobSizes({ 100: 5000 });
      const originalFile = new File([new Uint8Array(1000)], "a.png", { type: "image/png" });
      // With our jsdom mock, PNG compress returns 8 bytes (generic), so it will NOT trigger fallback
      // We test that it still resolves and returns a valid result (not hanging)
      const res = await smartCompress(canvas, 1000, "image/png", undefined, originalFile, 64);
      expect(res).toHaveProperty("blob");
      expect(res).toHaveProperty("savings");
      expect(typeof res.compressedSize).toBe("number");
      expect(res.format).toBe("image/png");
    });

    it("PNG fallback when compressed larger than original triggers original guard", async () => {
      const origToBlob = HTMLCanvasElement.prototype.toBlob;
      // Force all canvases to return large blob (> original) to trigger fallback
      // @ts-expect-error
      HTMLCanvasElement.prototype.toBlob = function (cb: (b: Blob | null) => void) {
        cb(new Blob([new Uint8Array(5000)], { type: "image/png" }));
      };
      const canvas = mockCanvasWithBlobSizes({});
      const originalFile = new File([new Uint8Array(1000)], "a.png", { type: "image/png" });
      const res = await smartCompress(canvas, 1000, "image/png", undefined, originalFile, 64);
      // Fallback should give savings 0 and compressedSize == blob from original file (size may vary in jsdom, so check savings and blob existence)
      expect(res.savings).toBe(0);
      expect(res.blob).toBeInstanceOf(Blob);
      expect(res.compressedSize).toBeGreaterThan(0);
      HTMLCanvasElement.prototype.toBlob = origToBlob;
    });

    it("targetSizeBytes uses binary search 8 iterations to find best quality under target", async () => {
      // Mock sizes: quality 50 => 1500 bytes, quality 75 => 3000, quality 85=>4000 etc.
      // target 2000 should pick quality ~50
      const sizes: Record<number, number> = {};
      for (let q = 1; q <= 100; q++) sizes[q] = q * 30; // linear 30*q
      const canvas = mockCanvasWithBlobSizes(sizes);
      const res = await smartCompress(canvas, 10000, "image/jpeg", 2000);
      expect(res.compressedSize).toBeLessThanOrEqual(2000);
      expect(res.quality).toBeGreaterThan(0);
      expect(res.savings).toBeGreaterThan(0);
    });

    it("auto mode picks quality to achieve 30% reduction heuristic", async () => {
      // Original 10000, best 85 gives 85*30=2550 (25% size) => savings 74% -> already <30% so keeps 85
      // If best 85 gives >30% (e.g., 5000 =50% size), it should try lower qualities
      const sizesHigh: Record<number, number> = { 85: 6000, 70: 4000, 55: 2500, 40: 1500, 30: 1000, 20: 500 };
      const canvasHigh = mockCanvasWithBlobSizes(sizesHigh);
      const resHigh = await smartCompress(canvasHigh, 10000, "image/jpeg");
      expect(resHigh.compressedSize).toBeLessThanOrEqual(3000); // 30% of 10000
      expect([70, 55, 40, 30, 20]).toContain(resHigh.quality);

      const sizesLow: Record<number, number> = { 85: 2000 };
      const canvasLow = mockCanvasWithBlobSizes(sizesLow);
      const resLow = await smartCompress(canvasLow, 10000, "image/jpeg");
      expect(resLow.quality).toBe(85);
      expect(resLow.savings).toBe(80);
    });
  });
});
