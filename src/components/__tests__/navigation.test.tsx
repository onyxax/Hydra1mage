import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NAV_ITEMS } from "@/components/navigation/nav-items";
import { DesktopTopBar } from "@/components/navigation/DesktopTopBar";
import { MobileTopBar } from "@/components/navigation/MobileNav";

// For Next.js Link mock — must forward style/className for active state test
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    // @ts-expect-error
    <a href={href} {...props}>
      {children}
    </a>,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("navigation — registry & truncation", () => {
  it("NAV_ITEMS has 11 entries including Home + 10 tools (assumption: 11)", () => {
    expect(NAV_ITEMS).toHaveLength(11);
    expect(NAV_ITEMS[0].href).toBe("/");
    expect(NAV_ITEMS.map((n) => n.label)).toEqual(
      expect.arrayContaining(["Crop", "Resize", "Compress", "Convert", "Rotate", "Flip", "Adjust", "Effects", "Thumbnail", "Info"])
    );
  });

  it("all NAV_ITEMS have icon and label (assumption: icon exists)", () => {
    for (const item of NAV_ITEMS) {
      expect(item.icon).toBeDefined();
      expect(typeof item.label).toBe("string");
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("DesktopTopBar truncates long file name with middle ellipsis and title (regression: header badge)", () => {
    const long = "very_long_file_name_2024_vacation_photo_final_edit_version2_with_extra.jpg";
    render(<DesktopTopBar pathname="/" fileName={long} onClear={() => {}} />);
    const truncated = screen.getByTitle(long);
    expect(truncated.textContent).toContain("…");
    expect(truncated.textContent).toContain(".jpg");
    expect(truncated.textContent!.length).toBeLessThan(long.length + 10); // + "active" badge text
  });

  it("DesktopTopBar hides badge when fileName null (assumption: no file -> no badge)", () => {
    render(<DesktopTopBar pathname="/" fileName={null} onClear={() => {}} />);
    expect(screen.queryByTitle(/\.jpg/)).not.toBeInTheDocument();
  });

  it("MobileTopBar truncates similarly and shows title (assumption: mobile 22-char)", () => {
    const long = "a".repeat(50) + ".png";
    render(<MobileTopBar fileName={long} onClear={() => {}} open={false} setOpen={() => {}} />);
    const el = screen.getByTitle(long);
    expect(el.textContent).toContain("…");
    expect(el.textContent?.endsWith(".png")).toBe(true);
  });

  it("active nav item gets accent background (assumption: pathname match)", () => {
    render(<DesktopTopBar pathname="/crop" fileName={null} onClear={() => {}} />);
    const cropLink = screen.getByText("Crop").closest("a") as HTMLElement;
    expect(cropLink.style.backgroundColor).toBeTruthy(); // should be accent-soft for active
  });
});
