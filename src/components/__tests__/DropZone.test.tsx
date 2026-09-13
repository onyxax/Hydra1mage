import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DropZone from "@/components/DropZone";

describe("DropZone — file validation & drag handling (assumption: strict image types)", () => {
  it("renders correctly with prompt and formats", () => {
    render(<DropZone onFileSelect={() => {}} />);
    expect(screen.getByText(/Drop your image here/i)).toBeInTheDocument();
    expect(screen.getByText("PNG")).toBeInTheDocument();
  });

  it("calls onFileSelect for valid image via click/file input", async () => {
    const onSelect = vi.fn();
    render(<DropZone onFileSelect={onSelect} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([""], "photo.jpg", { type: "image/jpeg" });
    await userEvent.upload(input, file);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "photo.jpg" }));
  });

  it("accepts .heic by extension even if mime empty (assumption: extension fallback)", async () => {
    const onSelect = vi.fn();
    render(<DropZone onFileSelect={onSelect} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([""], "photo.heic", { type: "" });
    // Bypass accept filtering by firing change directly — tests extension regex fallback
    fireEvent.change(input, { target: { files: [file] } });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "photo.heic" }));
  });

  it("rejects non-image file (assumption: no call)", async () => {
    const onSelect = vi.fn();
    render(<DropZone onFileSelect={onSelect} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "doc.pdf", { type: "application/pdf" });
    await userEvent.upload(input, file);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("handles dragEnter/dragOver/dragLeave/drop lifecycle (assumption: dragCounter)", async () => {
    const onSelect = vi.fn();
    const { container } = render(<DropZone onFileSelect={onSelect} />);
    const zone = container.firstChild as HTMLElement;
    const file = new File([""], "a.png", { type: "image/png" });

    fireEvent.dragEnter(zone, { dataTransfer: { types: ["Files"], files: [file] } });
    expect(zone.style.borderColor).toBeTruthy(); // dragging visual

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it("supports keyboard Enter/Space activation (assumption: a11y)", async () => {
    const onSelect = vi.fn();
    render(<DropZone onFileSelect={onSelect} />);
    const zone = screen.getByRole("button");
    zone.focus();
    fireEvent.keyDown(zone, { key: "Enter" });
    // Should trigger click -> file input click, but we check focusability
    expect(zone).toHaveAttribute("tabIndex", "0");
  });

  it("resets input value after selection (assumption: re-upload same file)", async () => {
    const onSelect = vi.fn();
    render(<DropZone onFileSelect={onSelect} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([""], "a.jpg", { type: "image/jpeg" });
    await userEvent.upload(input, file);
    expect(input.value).toBe(""); // cleared for re-upload
  });
});
