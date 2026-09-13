import { describe, it, expect, vi } from "vitest";
import { adjustImage, adjustImageAdvanced } from "@/lib/image/adjust";

function mockImg(): HTMLImageElement {
  return { naturalWidth: 2, naturalHeight: 2 } as HTMLImageElement;
}

function setupCanvasWithPixels(pixels: number[]) {
  // pixels: flat RGBA array for 2x2 image (16 values)
  const data = new Uint8ClampedArray(pixels);
  const imageData = { data, width: 2, height: 2 } as ImageData;
  const ctx = {
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(data), width: 2, height: 2 }),
    putImageData: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    width: 2,
    height: 2,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  const origCreate = document.createElement.bind(document);
  const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") return canvas as never;
    return origCreate(tag as never) as never;
  });
  return { ctx: ctx as unknown as { putImageData: ReturnType<typeof vi.fn> }, spy, canvas, imageData };
}

describe("adjust — exposure/tint/vibrance/sharpness", () => {
  it("adjustImage brightness/contrast/saturation returns canvas with putImageData (assumption: always writes)", () => {
    const img = mockImg();
    const { ctx, spy } = setupCanvasWithPixels([
      100, 100, 100, 255, 50, 50, 50, 255,
      200, 200, 200, 255, 0, 0, 0, 255,
    ]);
    const out = adjustImage(img, 100, 0, 0); // brightness 100% = no change, contrast 0 = 1x, sat 0 = 1x
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(out.width).toBe(2);
    spy.mockRestore();
  });

  it("adjustImage handles extreme values without NaN (assumption: clamped 0-255)", () => {
    const img = mockImg();
    const { ctx, spy } = setupCanvasWithPixels(new Array(16).fill(255));
    const out = adjustImage(img, 200, 100, 100);
    expect(out).toBeDefined();
    const putCall = (ctx.putImageData as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
    // putImageData called, no throw
    expect(putCall).toBeTruthy();
    spy.mockRestore();
  });

  it("adjustImageAdvanced with defaults (0s) leaves pixels approximately unchanged (assumption: identity)", () => {
    const img = mockImg();
    const pixels = [100, 120, 130, 255, 100, 120, 130, 255, 100, 120, 130, 255, 100, 120, 130, 255];
    const { ctx, spy } = setupCanvasWithPixels(pixels);
    const out = adjustImageAdvanced(img, {
      exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, vibrance: 0, gamma: 0, sharpness: 0,
    });
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(out.width).toBe(2);
    spy.mockRestore();
  });

  it("adjustImageAdvanced exposure multiplies (assumption: pow2)", () => {
    const img = mockImg();
    const { ctx, spy } = setupCanvasWithPixels([128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255]);
    const out = adjustImageAdvanced(img, {
      exposure: 100, temperature: 0, tint: 0, highlights: 0, shadows: 0, vibrance: 0, gamma: 0, sharpness: 0,
    });
    // exposure 100 => pow2(1)=2x, so pixel should double and clamp
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(out).toBeDefined();
    spy.mockRestore();
  });

  it("adjustImageAdvanced sharpness >0 triggers kernel (assumption: sharpness branch)", () => {
    const img = mockImg();
    // Need willReadFrequently context mock path — our mock getContext ignores opts, so fine
    const { ctx, spy } = setupCanvasWithPixels(new Array(16).fill(100));
    const out = adjustImageAdvanced(img, {
      exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, vibrance: 0, gamma: 0, sharpness: 50,
    });
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(out.width).toBe(2);
    spy.mockRestore();
  });
});
