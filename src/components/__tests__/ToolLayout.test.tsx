import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ToolLayout from "@/components/shared/ToolLayout";

// Regression: previously ToolLayout used imageFile!.name and crashed when
// previewUrl existed but imageFile was null (sync race after clear).
// Now it guards both.

vi.mock("@/components/shared/ImagePreview", () => ({
  ImagePreview: ({ fileName }: { fileName: string }) => <div data-testid="preview">{fileName}</div>,
  formatFileSize: (n: number) => `${n} B`,
}));
vi.mock("@/components/shared/SmartPreview", () => ({
  SmartImagePreview: ({ fileName }: { fileName: string }) => <div data-testid="preview">{fileName}</div>,
}));
vi.mock("@/hooks/useImageLoader", () => ({
  useImageDimensions: () => ({ w: 100, h: 100 }),
}));

vi.mock("@/components/DropZone", () => ({
  default: ({ onFileSelect }: { onFileSelect: (f: File) => void }) => (
    <div data-testid="dropzone" onClick={() => onFileSelect(new File([""], "mock.jpg"))}>
      drop
    </div>
  ),
}));

describe("ToolLayout — null guard regression (imageFile is null)", () => {
  const baseProps = {
    title: "Convert",
    subtitle: "Upload",
    onFileSelect: vi.fn(),
    onClearImage: vi.fn(),
    children: <div data-testid="controls">controls</div>,
  };

  it("shows DropZone when previewUrl null (assumption: no image -> upload)", () => {
    render(<ToolLayout {...baseProps} imageFile={null} previewUrl={null} />);
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    expect(screen.queryByTestId("preview")).not.toBeInTheDocument();
  });

  it("shows DropZone when previewUrl exists but imageFile null (regression: previously threw)", () => {
    // This was the bug: previewUrl truthy but imageFile null => TypeError at imageFile!.name
    expect(() =>
      render(<ToolLayout {...baseProps} imageFile={null} previewUrl="blob:mock" />)
    ).not.toThrow();
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
  });

  it("shows ImagePreview with controls when both exist (assumption: happy path)", () => {
    const file = new File(["hello"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1234 });
    render(<ToolLayout {...baseProps} imageFile={file} previewUrl="blob:mock" />);
    expect(screen.getByTestId("preview")).toHaveTextContent("photo.jpg");
    expect(screen.getByTestId("controls")).toBeInTheDocument();
  });

  it("shows DropZone when imageFile exists but previewUrl null (assumption: sync waiting)", () => {
    const file = new File([""], "a.jpg");
    render(<ToolLayout {...baseProps} imageFile={file} previewUrl={null} />);
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
  });

  it("subtitle from props displayed in both states (assumption: ToolHeader)", () => {
    const { rerender } = render(
      <ToolLayout {...baseProps} title="Crop" subtitle="3x4" imageFile={null} previewUrl={null} />
    );
    expect(screen.getByText("Crop")).toBeInTheDocument();
    expect(screen.getByText("3x4")).toBeInTheDocument();

    const file = new File([""], "b.jpg");
    rerender(<ToolLayout {...baseProps} title="Crop" subtitle="3x4" imageFile={file} previewUrl="blob:mock" />);
    expect(screen.getByText("Crop")).toBeInTheDocument();
  });
});
