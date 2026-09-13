import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ImageProvider, useImageContext } from "@/lib/image-context";

function Consumer({ onRender }: { onRender: (v: ReturnType<typeof useImageContext>) => void }) {
  const ctx = useImageContext();
  onRender(ctx);
  return (
    <div>
      <span data-testid="file">{ctx.imageFile?.name ?? "null"}</span>
      <span data-testid="url">{ctx.previewUrl ?? "null"}</span>
      <button onClick={() => ctx.handleFileSelect(new File(["hi"], "photo.jpg", { type: "image/jpeg" }))}>
        select
      </button>
      <button onClick={() => ctx.handleClearImage()}>clear</button>
    </div>
  );
}

describe("image-context — sync file/url and lifecycle (regression: ToolLayout crash)", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("initially null/null (assumption: no image)", () => {
    let ctx: ReturnType<typeof useImageContext> | null = null;
    render(
      <ImageProvider>
        <Consumer onRender={(v) => (ctx = v)} />
      </ImageProvider>
    );
    expect(screen.getByTestId("file").textContent).toBe("null");
    expect(screen.getByTestId("url").textContent).toBe("null");
  });

  it("handleFileSelect sets file and url synchronously (regression: no one-frame lag)", async () => {
    render(
      <ImageProvider>
        <Consumer onRender={() => {}} />
      </ImageProvider>
    );
    const btn = screen.getByText("select");
    await act(async () => btn.click());
    // After click, both should be set immediately (no effect delay)
    expect(screen.getByTestId("file").textContent).toBe("photo.jpg");
    expect(screen.getByTestId("url").textContent).toBe("blob:mock-url");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("handleClear pushes null to history and keeps old URL for undo (productivity)", async () => {
    let ctx: ReturnType<typeof useImageContext> | null = null;
    render(
      <ImageProvider>
        <Consumer onRender={(v) => (ctx = v)} />
      </ImageProvider>
    );
    await act(async () => screen.getByText("select").click());
    expect(screen.getByTestId("url").textContent).toBe("blob:mock-url");
    await act(async () => screen.getByText("clear").click());
    expect(screen.getByTestId("file").textContent).toBe("null");
    expect(screen.getByTestId("url").textContent).toBe("null");
    // With history, old URL is kept for undo, not revoked immediately
    expect(ctx!.canUndo).toBe(true);
    expect(ctx!.historyLength).toBe(3); // null -> photo -> null
    await act(async () => ctx!.handleUndo());
    expect(screen.getByTestId("file").textContent).toBe("photo.jpg");
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:mock-url");
  });

  it("replaces file keeps history for undo (no immediate revoke)", async () => {
    let ctx: ReturnType<typeof useImageContext> | null = null;
    const { unmount } = render(
      <ImageProvider>
        <Consumer onRender={(v) => (ctx = v)} />
      </ImageProvider>
    );
    await act(async () => {
      ctx!.handleFileSelect(new File(["a"], "first.jpg"));
    });
    expect(ctx!.historyLength).toBe(2);
    expect(ctx!.canUndo).toBe(true);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:second");
    await act(async () => {
      ctx!.handleFileSelect(new File(["b"], "second.jpg"));
    });
    expect(ctx!.historyLength).toBe(3);
    expect(ctx!.canUndo).toBe(true);
    // Old URL kept for undo, not revoked
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    await act(async () => ctx!.handleUndo());
    expect(ctx!.imageFile?.name).toBe("first.jpg");
    await act(async () => ctx!.handleRedo());
    expect(ctx!.imageFile?.name).toBe("second.jpg");
    unmount();
  });

  it("previewUrl and imageFile stay in sync — never one null and other truthy for more than sync tick (invariant)", async () => {
    let snapshots: Array<{ file: string | null; url: string | null }> = [];
    function Tracker() {
      const ctx = useImageContext();
      snapshots.push({ file: ctx.imageFile?.name ?? null, url: ctx.previewUrl });
      return null;
    }
    render(
      <ImageProvider>
        <Tracker />
        <Consumer onRender={() => {}} />
      </ImageProvider>
    );
    snapshots = [];
    await act(async () => screen.getByText("select").click());
    // After select, last snapshot should have both truthy
    const last = snapshots[snapshots.length - 1];
    expect(last.file).toBe("photo.jpg");
    expect(last.url).toBe("blob:mock-url");
    snapshots = [];
    await act(async () => screen.getByText("clear").click());
    const lastClear = snapshots[snapshots.length - 1];
    expect(lastClear.file).toBeNull();
    expect(lastClear.url).toBeNull();
  });
});
