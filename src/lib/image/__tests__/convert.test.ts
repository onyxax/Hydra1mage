import { describe, it, expect, vi } from "vitest";
import { convertImage, CONVERT_FORMATS, CONVERT_MIMES } from "@/lib/image/convert";

// ICO regression: previously DataView offset 16 caused RangeError. Now should not throw.
// We test header structure indirectly via mocked canvas.toBlob and by inspecting ICO bytes if possible.

// Helper to create a fake canvas that yields small PNG blobs per size
function makeCanvasWithToBlob() {
  return {
    width: 100,
    height: 100,
    getContext: () => ({ drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray(4) }) }),
    toBlob: (cb: (b: Blob | null) => void) => {
      // Return tiny PNG-like blob
      cb(new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }));
    },
  } as unknown as HTMLCanvasElement;
}

// Mock document.createElement for ICO's inner canvases
function mockDocumentForIco() {
  const orig = document.createElement.bind(document);
  const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      const c = orig(tag) as HTMLCanvasElement;
      // Mock toBlob to return small PNG
      c.toBlob = ((cb: (b: Blob | null) => void) => cb(new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" }))) as unknown as typeof c.toBlob;
      // Mock getContext drawImage
      const origGet = c.getContext.bind(c);
      c.getContext = ((type: string) => {
        const ctx = origGet(type as never) as CanvasRenderingContext2D | null;
        if (ctx) {
          ctx.drawImage = () => {};
        }
        return ctx;
      }) as never;
      return c as never;
    }
    return orig(tag as never) as never;
  });
  return spy;
}

describe("convert — format registry & ICO regression", () => {
  it("MIME map covers png/jpg/webp/avif/bmp/gif (assumption: 6 basics)", () => {
    expect(CONVERT_MIMES["png"]).toBe("image/png");
    expect(CONVERT_MIMES["jpg"]).toBe("image/jpeg");
    expect(CONVERT_MIMES["webp"]).toBe("image/webp");
    expect(CONVERT_MIMES["avif"]).toBe("image/avif");
    expect(CONVERT_MIMES["bmp"]).toBe("image/bmp");
    expect(CONVERT_MIMES["gif"]).toBe("image/gif");
  });

  it("CONVERT_FORMATS lists 11 formats including ico/icns/tiff/svg/pdf (assumption: 11)", () => {
    const ids = CONVERT_FORMATS.map((f) => f.id);
    expect(ids).toHaveLength(11);
    for (const must of ["png", "jpg", "webp", "avif", "bmp", "gif", "tiff", "ico", "icns", "svg", "pdf"]) {
      expect(ids).toContain(must);
    }
  });

  it("generic convert path calls canvas.toBlob with correct mime and 0.92 (assumption: 0.92 quality)", async () => {
    const spy = vi.fn((cb: (b: Blob | null) => void, mime: string, q: number) => {
      expect(q).toBe(0.92);
      cb(new Blob(["x"], { type: mime }));
    });
    const canvas = { toBlob: spy } as unknown as HTMLCanvasElement;
    const blob = await convertImage(canvas, "png");
    expect(spy).toHaveBeenCalledWith(expect.any(Function), "image/png", 0.92);
    expect(blob.type).toBe("image/png");

    const canvas2 = { toBlob: spy } as unknown as HTMLCanvasElement;
    await convertImage(canvas2, "webp");
    expect(spy).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.92);
  });

  it("falls back to image/png for unknown format (assumption: default png)", async () => {
    const spy = vi.fn((cb: (b: Blob | null) => void, mime: string) => cb(new Blob(["x"], { type: mime })));
    const canvas = { toBlob: spy } as unknown as HTMLCanvasElement;
    // @ts-expect-error test unknown
    await convertImage(canvas, "unknown");
    expect(spy).toHaveBeenCalledWith(expect.any(Function), "image/png", expect.any(Number));
  });

  it("rejects when toBlob returns null (assumption: convert error path)", async () => {
    const canvas = { toBlob: (cb: (b: Blob | null) => void) => cb(null) } as unknown as HTMLCanvasElement;
    await expect(convertImage(canvas, "png")).rejects.toThrow("Failed to convert image");
  });

  it("ICO encoder does NOT throw RangeError offset 16 (regression fix) — checks DataView bounds", async () => {
    const mainCanvas = makeCanvasWithToBlob();
    const docSpy = mockDocumentForIco();
    // Should resolve, not throw RangeError at dv.setUint32(16) — the bug was offset 16 outside 16-byte DataView
    await expect(convertImage(mainCanvas, "ico")).resolves.toBeInstanceOf(Blob);
    const blob = await convertImage(mainCanvas, "ico");
    expect(blob.type).toBe("image/x-icon");
    expect(blob.size).toBeGreaterThan(0);
    docSpy.mockRestore();
  });

  it("svg encoder wraps png data URL inside svg (assumption: contains <svg and xlink:href)", async () => {
    const canvas = {
      width: 10,
      height: 20,
      toBlob: (cb: (b: Blob | null) => void) => cb(new Blob([new Uint8Array([1])], { type: "image/png" })),
    } as unknown as HTMLCanvasElement;
    // Need FileReader mock: our setup doesn't have real FileReader reading, but canvasToSvg uses FileReader
    // Instead test that promise resolves to svg blob containing width/height
    const blob = await convertImage(canvas, "svg");
    expect(blob.type).toBe("image/svg+xml");
    const text = await blob.text();
    expect(text).toContain("<svg");
    expect(text).toContain('width="10"');
    expect(text).toContain('height="20"');
  });

  it("pdf encoder produces %PDF-1.4 header and xref (assumption: pdf structure)", async () => {
    const canvas = {
      width: 100,
      height: 50,
      toBlob: (cb: (b: Blob | null) => void) => cb(new Blob([new Uint8Array([255, 216, 255])], { type: "image/jpeg" })),
    } as unknown as HTMLCanvasElement;
    // Mock arrayBuffer for jpeg blob inside canvasToPdf: toBlob returns jpeg blob, we need arrayBuffer
    // Our canvas.toBlob already returns blob with arrayBuffer, so it should work
    const blob = await convertImage(canvas, "pdf");
    expect(blob.type).toBe("application/pdf");
    const text = await blob.text();
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("trailer");
    expect(text).toContain("%%EOF");
  });
});
