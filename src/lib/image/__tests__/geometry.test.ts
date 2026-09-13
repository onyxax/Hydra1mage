import { describe, it, expect, vi } from "vitest";
import { cropImage, resizeImage, rotateImage, flipImage } from "@/lib/image/geometry";

// Assumptions:
// - crop/resize/rotate/flip never mutate input img, always return new canvas with correct dimensions
// - rotate accounts for bounding box (sin/cos)
// - flip uses translate/scale correctly
// We mock canvas getContext to capture draw calls without real pixels.

function mockImg(w: number, h: number): HTMLImageElement {
  return { naturalWidth: w, naturalHeight: h } as HTMLImageElement;
}

function mockCanvasContext() {
  const calls: string[] = [];
  const ctx = {
    drawImage: vi.fn((...args: unknown[]) => calls.push(`drawImage:${args.length}`)),
    translate: vi.fn((x: number, y: number) => calls.push(`translate:${x},${y}`)),
    rotate: vi.fn((r: number) => calls.push(`rotate:${r}`)),
    scale: vi.fn((x: number, y: number) => calls.push(`scale:${x},${y}`)),
  } as unknown as CanvasRenderingContext2D;
  const origCreate = document.createElement.bind(document);
  const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      const c = origCreate(tag) as HTMLCanvasElement;
      vi.spyOn(c, "getContext").mockReturnValue(ctx as never);
      return c as never;
    }
    return origCreate(tag as never) as never;
  });
  return { ctx, spy, calls };
}

describe("geometry — spatial transforms", () => {
  it("cropImage creates canvas WxH and draws with correct source rect", () => {
    const { ctx, spy } = mockCanvasContext();
    const img = mockImg(200, 100);
    const c = cropImage(img, 10, 20, 50, 30);
    expect(c.width).toBe(50);
    expect(c.height).toBe(30);
    expect((ctx.drawImage as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]).toEqual(
      [img, 10, 20, 50, 30, 0, 0, 50, 30]
    );
    spy.mockRestore();
  });

  it("resizeImage creates target dims and draws", () => {
    const { ctx, spy } = mockCanvasContext();
    const img = mockImg(100, 100);
    const c = resizeImage(img, 50, 75);
    expect(c.width).toBe(50);
    expect(c.height).toBe(75);
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0, 50, 75);
    spy.mockRestore();
  });

  it("rotateImage 0° keeps dims, 90° swaps, 180° keeps, 45° enlarges bbox", () => {
    // Use real canvas creation but mocked context to check dims
    const img = mockImg(100, 50);
    for (const deg of [0, 90, 180, 270]) {
      const { spy } = mockCanvasContext();
      const c = rotateImage(img, deg);
      if (deg === 0 || deg === 180) {
        expect(c.width).toBe(100);
        expect(c.height).toBe(50);
      } else {
        expect(c.width).toBe(50);
        expect(c.height).toBe(100);
      }
      spy.mockRestore();
    }
    // 45° should be larger than original (bounding box)
    const { spy } = mockCanvasContext();
    const c45 = rotateImage(img, 45);
    expect(c45.width).toBeGreaterThan(100);
    expect(c45.height).toBeGreaterThan(50);
    spy.mockRestore();
  });

  it("flipImage horizontal translates and scales -1,1", () => {
    const { ctx, spy } = mockCanvasContext();
    const img = mockImg(80, 60);
    const c = flipImage(img, true, false);
    expect(c.width).toBe(80);
    expect(c.height).toBe(60);
    expect(ctx.translate).toHaveBeenCalledWith(80, 0);
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
    spy.mockRestore();
  });

  it("flipImage vertical translates and scales 1,-1, both does both", () => {
    for (const [h, v, tx, ty, sx, sy] of [
      [false, true, 0, 60, 1, -1],
      [true, true, 80, 60, -1, -1],
    ] as const) {
      const { ctx, spy } = mockCanvasContext();
      const img = mockImg(80, 60);
      flipImage(img, h, v);
      expect(ctx.translate).toHaveBeenCalledWith(tx, ty);
      expect(ctx.scale).toHaveBeenCalledWith(sx, sy);
      spy.mockRestore();
    }
  });

  it("flipImage no flip leaves identity (assumption: scale 1,1, translate 0,0)", () => {
    const { ctx, spy } = mockCanvasContext();
    const img = mockImg(10, 10);
    flipImage(img, false, false);
    expect(ctx.translate).toHaveBeenCalledWith(0, 0);
    expect(ctx.scale).toHaveBeenCalledWith(1, 1);
    spy.mockRestore();
  });
});
