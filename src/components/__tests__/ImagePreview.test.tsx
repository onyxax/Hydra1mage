import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImagePreview } from "@/components/shared/ImagePreview";

describe("ImagePreview — long name truncation & actions (regression: 32-char middle truncation)", () => {
  const longName = "very_long_file_name_2024_vacation_photo_final_edit_version2.jpg";
  const fileSize = "2.4 MB";
  const previewUrl = "blob:mock-url";

  it("renders truncated name preserving extension and title full name", () => {
    render(<ImagePreview previewUrl={previewUrl} fileName={longName} fileSize={fileSize} onClear={() => {}} />);
    const nameEl = screen.getByText((_, el) => el?.textContent?.includes("…") && el?.textContent?.endsWith(".jpg") || false);
    expect(nameEl).toBeInTheDocument();
    // title should be full name
    expect(nameEl).toHaveAttribute("title", longName);
  });

  it("short name not truncated (assumption: <=32 no ellipsis)", () => {
    render(<ImagePreview previewUrl={previewUrl} fileName="short.jpg" fileSize={fileSize} onClear={() => {}} />);
    expect(screen.getByText("short.jpg")).toBeInTheDocument();
    expect(screen.queryByText(/…/)).not.toBeInTheDocument();
  });

  it("shows fileSize and keeps title", () => {
    render(<ImagePreview previewUrl={previewUrl} fileName="a.jpg" fileSize={fileSize} onClear={() => {}} />);
    const sizeEl = screen.getByText(fileSize);
    expect(sizeEl).toHaveAttribute("title", fileSize);
  });

  it("calls onClear when X clicked (assumption: clear action)", async () => {
    const onClear = vi.fn();
    render(<ImagePreview previewUrl={previewUrl} fileName="a.jpg" fileSize={fileSize} onClear={onClear} />);
    const btn = screen.getByLabelText("Remove image");
    fireEvent.click(btn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("image has alt full name and src previewUrl (assumption: accessibility)", () => {
    render(<ImagePreview previewUrl={previewUrl} fileName={longName} fileSize={fileSize} onClear={() => {}} />);
    const img = screen.getByAltText(longName) as HTMLImageElement;
    expect(img.src).toContain("blob:mock-url");
  });

  it("container has overflow-hidden for long names (assumption: layout guard)", () => {
    const { container } = render(<ImagePreview previewUrl={previewUrl} fileName={longName} fileSize={fileSize} onClear={() => {}} />);
    const nameWrapper = container.querySelector(".min-w-0");
    expect(nameWrapper).toBeInTheDocument();
  });

  it("handles Arabic long name (assumption: unicode)", () => {
    const arName = "صورة_طويلة_جدا_للاختبار_مع_اسم_ملف_طويل_جدا.jpg";
    render(<ImagePreview previewUrl={previewUrl} fileName={arName} fileSize={fileSize} onClear={() => {}} />);
    const el = screen.getByTitle(arName);
    expect(el.textContent).toContain("…");
    expect(el.textContent).toContain(".jpg");
  });
});
