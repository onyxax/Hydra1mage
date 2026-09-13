import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useImageDimensions } from "@/hooks/useImageLoader";
import * as core from "@/lib/image/core";

describe("hooks/useImageLoader — useImageDimensions (previously copy-pasted in 4 places)", () => {
  it("returns null initially when previewUrl null (assumption: no image)", () => {
    const { result } = renderHook(() => useImageDimensions(null));
    expect(result.current).toBeNull();
  });

  it("loads dimensions via loadImage and returns w/h (assumption: happy path)", async () => {
    vi.spyOn(core, "loadImage").mockResolvedValue({ naturalWidth: 800, naturalHeight: 600 } as HTMLImageElement);
    const { result } = renderHook(() => useImageDimensions("blob:mock"));
    await waitFor(() => expect(result.current).toEqual({ w: 800, h: 600 }));
  });

  it("returns null on loadImage failure (assumption: catch -> null)", async () => {
    vi.spyOn(core, "loadImage").mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useImageDimensions("blob:bad"));
    await waitFor(() => expect(result.current).toBeNull());
  });

  it("cancels stale load when previewUrl changes quickly (assumption: cancelled flag)", async () => {
    let resolveFirst: (v: HTMLImageElement) => void;
    const firstPromise = new Promise<HTMLImageElement>((res) => (resolveFirst = res));
    const secondPromise = Promise.resolve({ naturalWidth: 100, naturalHeight: 100 } as HTMLImageElement);
    const spy = vi.spyOn(core, "loadImage")
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => secondPromise);

    const { result, rerender } = renderHook(({ url }) => useImageDimensions(url), {
      initialProps: { url: "blob:first" as string | null },
    });
    rerender({ url: "blob:second" });
    // Resolve first after switch — should be ignored
    resolveFirst!({ naturalWidth: 999, naturalHeight: 999 } as HTMLImageElement);
    await waitFor(() => expect(result.current).toEqual({ w: 100, h: 100 }));
    expect(result.current?.w).not.toBe(999);
    spy.mockRestore();
  });

  it("resets to null when previewUrl becomes null (assumption: clear)", async () => {
    vi.spyOn(core, "loadImage").mockResolvedValue({ naturalWidth: 10, naturalHeight: 10 } as HTMLImageElement);
    const { result, rerender } = renderHook(({ url }) => useImageDimensions(url), {
      initialProps: { url: "blob:a" as string | null },
    });
    await waitFor(() => expect(result.current).not.toBeNull());
    rerender({ url: null });
    expect(result.current).toBeNull();
  });
});
