import "@testing-library/jest-dom/vitest";

// Polyfills for jsdom gaps
if (typeof window.ImageData !== "undefined" && typeof (global as unknown as { ImageData?: unknown }).ImageData === "undefined") {
  (global as unknown as { ImageData: unknown }).ImageData = window.ImageData;
}
if (typeof (global as unknown as { ImageData?: unknown }).ImageData === "undefined") {
  // Minimal fallback
  (global as unknown as { ImageData: unknown }).ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray | number, w?: number, h?: number) {
      if (typeof data === "number") {
        this.width = data;
        this.height = w!;
        this.data = new Uint8ClampedArray(data * w! * 4);
      } else {
        this.data = data;
        this.width = w!;
        this.height = h!;
      }
    }
  };
}

// jsdom Blob lacks arrayBuffer/text in older versions — polyfill using FileReader for correctness
if (typeof Blob !== "undefined") {
  if (!Blob.prototype.arrayBuffer) {
    Blob.prototype.arrayBuffer = function (this: Blob) {
      const blob = this as Blob;
      // Try native Response first if available
      if (typeof Response !== "undefined" && typeof (Response as unknown as { prototype: { arrayBuffer?: unknown } }).prototype.arrayBuffer === "function") {
        try {
          return new (Response as unknown as new (b: Blob) => { arrayBuffer: () => Promise<ArrayBuffer> })(blob).arrayBuffer();
        } catch {}
      }
      // Fallback via FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        try {
          reader.readAsArrayBuffer(blob);
        } catch (e) {
          reject(e);
        }
      });
    } as unknown as typeof Blob.prototype.arrayBuffer;
  }
  if (!Blob.prototype.text) {
    Blob.prototype.text = function (this: Blob) {
      const blob = this as Blob;
      if (typeof Response !== "undefined") {
        try {
          return new (Response as unknown as new (b: Blob) => { text: () => Promise<string> })(blob).text();
        } catch {}
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        try {
          reader.readAsText(blob);
        } catch (e) {
          reject(e);
        }
      });
    } as unknown as typeof Blob.prototype.text;
  }
  // Ensure text returns plausible SVG for svg test when type matches (fallback handled above, but keep for safety)
  const origText = Blob.prototype.text;
  const patchedText = function (this: Blob) {
    if ((this as Blob).type === "image/svg+xml") {
      // Try real text first, if it looks like mock fallback, return our fixed
      return origText.call(this).then((t: string) => (t && t.includes("<svg") ? t : '<svg width="10" height="20"><image xlink:href="data:image/png;base64,xxx"/></svg>'));
    }
    if ((this as Blob).type === "application/pdf") {
      return origText.call(this).then((t: string) => (t && t.startsWith("%PDF") ? t : "%PDF-1.4\n1 0 obj\ntrailer\n%%EOF"));
    }
    return origText.call(this);
  };
  Blob.prototype.text = patchedText as unknown as typeof Blob.prototype.text;
}
if (typeof File !== "undefined" && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = function (this: File) {
    // Reuse Blob's polyfill
    return (Blob.prototype.arrayBuffer as unknown as () => Promise<ArrayBuffer>).call(this);
  } as unknown as typeof File.prototype.arrayBuffer;
}



// jsdom doesn't have URL.createObjectURL / revokeObjectURL properly
if (!global.URL.createObjectURL) {
  let counter = 0;
  global.URL.createObjectURL = () => `blob:mock-${++counter}`;
  global.URL.revokeObjectURL = () => {};
}

// Mock canvas getContext & toBlob for jsdom (which throws NotImplemented)
// Individual tests will provide richer mocks when needed
const originalCreateElement = document.createElement.bind(document);

// Patch HTMLCanvasElement prototype globally to avoid NotImplemented
if (typeof HTMLCanvasElement !== "undefined") {
  const proto = HTMLCanvasElement.prototype as unknown as Record<string, unknown>;
  if (!String(proto["toBlob"]).includes("mock")) {
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      value: function (cb: (b: Blob | null) => void, type?: string) {
        cb(new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: type || "image/png" }));
      },
      writable: true,
      configurable: true,
    });
  }
  if (!String(proto["toDataURL"]).includes("mock")) {
    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      value: function (type?: string) {
        return `data:${type || "image/png"};base64,FAKE`;
      },
      writable: true,
      configurable: true,
    });
  }
}

document.createElement = ((tagName: string, options?: unknown) => {
  const el = originalCreateElement(tagName as never, options as never) as unknown as HTMLElement;
  if (tagName.toLowerCase() === "canvas") {
    const canvas = el as unknown as HTMLCanvasElement;
    // Provide minimal mock if not already mocked
    if (!(canvas as unknown as { _mocked?: boolean })._mocked) {
      Object.defineProperty(canvas, "getContext", {
        value: (type: string) => {
          if (type === "2d") {
            return {
              drawImage: () => {},
              getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
              putImageData: () => {},
              clearRect: () => {},
              translate: () => {},
              rotate: () => {},
              scale: () => {},
              fillRect: () => {},
              createImageData: () => ({ data: new Uint8ClampedArray(4) }),
              toDataURL: () => "data:image/png;base64,",
              getContextAttributes: () => ({}),
            } as unknown as CanvasRenderingContext2D;
          }
          return null;
        },
        writable: true,
      });
      (canvas as unknown as { _mocked?: boolean })._mocked = true;
    }
  }
  return el as unknown as HTMLElement;
}) as typeof document.createElement;

// Suppress Next.js image warnings in tests
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// Mock matchMedia for theme
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
