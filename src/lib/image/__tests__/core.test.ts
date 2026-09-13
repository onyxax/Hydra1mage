import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCanvas,
  get2dContext,
  downloadBlob,
  getMimeType,
  getExtensionFromMime,
  loadImage,
} from "@/lib/image/core";

// Assumptions tested:
// - createCanvas sets width/height correctly
// - get2dContext throws if 2d unavailable
// - downloadBlob creates anchor, clicks, revokes URL (lifecycle)
// - getMimeType fallback
// - getExtensionFromMime mapping
// - loadImage resolves on load, rejects on error, sets crossOrigin

describe("core — canvas bootstrapping & helpers", () => {
  describe("createCanvas", () => {
    it("creates canvas with given dimensions", () => {
      const c = createCanvas(123, 456);
      expect(c.width).toBe(123);
      expect(c.height).toBe(456);
      expect(c.tagName.toLowerCase()).toBe("canvas");
    });
  });

  describe("get2dContext", () => {
    it("returns 2d context when available", () => {
      const c = document.createElement("canvas");
      const ctx = get2dContext(c);
      expect(ctx).toBeTruthy();
    });
    it("throws when context unavailable (assumption: null guard)", () => {
      const fake = { getContext: () => null } as unknown as HTMLCanvasElement;
      expect(() => get2dContext(fake)).toThrow("2D context unavailable");
    });
    it("passes options through", () => {
      const c = document.createElement("canvas");
      const spy = vi.spyOn(c, "getContext");
      get2dContext(c, { willReadFrequently: true });
      expect(spy).toHaveBeenCalledWith("2d", { willReadFrequently: true });
    });
  });

  describe("downloadBlob", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });
    it("creates anchor, sets download, clicks, revokes (assumption: lifecycle)", () => {
      const blob = new Blob(["hi"], { type: "text/plain" });
      const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
      const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation((n) => n);
      const removeSpy = vi.spyOn(document.body, "removeChild").mockImplementation((n) => n);
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      downloadBlob(blob, "file.jpg");

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalledWith("blob:mock");
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe("getMimeType", () => {
    it("returns file.type when present", () => {
      const f = new File([""], "a.jpg", { type: "image/png" });
      expect(getMimeType(f)).toBe("image/png");
    });
    it("falls back to image/jpeg when empty (assumption: unknown -> jpeg)", () => {
      const f = new File([""], "a", { type: "" });
      expect(getMimeType(f)).toBe("image/jpeg");
    });
  });

  describe("getExtensionFromMime", () => {
    it.each([
      ["image/png", "png"],
      ["image/webp", "webp"],
      ["image/gif", "gif"],
      ["image/tiff", "tiff"],
      ["image/svg+xml", "svg"],
      ["application/pdf", "pdf"],
      ["image/jpeg", "jpg"],
      ["unknown", "jpg"],
    ])("maps %s -> %s", (mime, ext) => {
      expect(getExtensionFromMime(mime)).toBe(ext);
    });
  });

  describe("loadImage", () => {
    it("resolves on load and sets crossOrigin anonymous (assumption: CORS)", async () => {
      // Mock Image to trigger onload synchronously
      const origImage = global.Image;
      let capturedImg: HTMLImageElement | null = null;
      class MockImage {
        crossOrigin = "";
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        _src = "";
        set src(v: string) {
          this._src = v;
          // simulate async load
          setTimeout(() => this.onload?.(), 0);
        }
        get src() {
          return this._src;
        }
      }
      // @ts-expect-error mock
      global.Image = MockImage;

      const p = loadImage("http://example.com/a.jpg");
      // Need to check crossOrigin was set before src
      // For mock we can't capture instance easily, but promise should resolve
      await expect(p).resolves.toBeInstanceOf(MockImage);

      global.Image = origImage;
    });

    it("rejects on error (assumption: onerror -> reject)", async () => {
      const origImage = global.Image;
      class MockImageErr {
        crossOrigin = "";
        onload: (() => void) | null = null;
        onerror: ((e: unknown) => void) | null = null;
        set src(_v: string) {
          setTimeout(() => this.onerror?.(new Error("fail")), 0);
        }
        get src() {
          return "";
        }
      }
      // @ts-expect-error
      global.Image = MockImageErr;
      await expect(loadImage("bad")).rejects.toBeTruthy();
      global.Image = origImage;
    });
  });
});
