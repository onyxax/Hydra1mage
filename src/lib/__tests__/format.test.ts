import { describe, it, expect } from "vitest";
import { truncateFileName, shortFileName, detailFileName } from "@/lib/format";

describe("format — file name truncation (critical: long names UX)", () => {
  describe("truncateFileName", () => {
    it("returns short names unchanged (assumption: <= max no-op)", () => {
      expect(truncateFileName("photo.jpg", 28)).toBe("photo.jpg");
      expect(truncateFileName("a.png", 28)).toBe("a.png");
      expect(truncateFileName("".padEnd(28, "a") + ".jpg".slice(0, 0))).toBeTruthy();
    });

    it("preserves extension with middle ellipsis for long names", () => {
      const long = "very_long_file_name_2024_vacation_photo_final_edit.jpg";
      const out = truncateFileName(long, 28);
      expect(out.length).toBeLessThanOrEqual(28);
      expect(out.endsWith(".jpg")).toBe(true);
      expect(out).toContain("…");
      // Front part preserved
      expect(out.startsWith("very_long")).toBe(true);
    });

    it("handles names without extension via end-truncate", () => {
      const noExt = "a".repeat(50);
      const out = truncateFileName(noExt, 28);
      expect(out.length).toBeLessThanOrEqual(28);
      expect(out.endsWith("…")).toBe(true);
      expect(out).not.toContain(".");
    });

    it("handles very long extension (>10) via end-truncate fallback (assumption: weird ext)", () => {
      const weird = "file." + "a".repeat(30); // 35 >28 triggers truncate
      const out = truncateFileName(weird, 28);
      expect(out.endsWith("…")).toBe(true);
      expect(out.length).toBeLessThanOrEqual(28);
    });

    it("handles dot too early (<3) via end-truncate", () => {
      const dotEarly = ".hiddenfile" + "a".repeat(30);
      const out = truncateFileName(dotEarly, 28);
      expect(out.endsWith("…")).toBe(true);
    });

    it("handles single char base with keep <=6 edge", () => {
      // Force keep <=6 path: max small
      const name = "ab.jpg";
      const out = truncateFileName("a".repeat(10) + ".jpg", 10);
      expect(out.endsWith(".jpg")).toBe(true);
    });

    it("handles Arabic / unicode file names (assumption: unicode length counts)", () => {
      const ar = "صورة_طويلة_جدا_للاختبار_مع_اسم_ملف_طويل.jpg";
      const out = truncateFileName(ar, 28);
      expect(out.endsWith(".jpg")).toBe(true);
      expect(out).toContain("…");
    });

    it("handles exact max boundary (assumption: no off-by-one)", () => {
      const name = "a".repeat(24) + ".jpg"; // 28 exactly
      expect(truncateFileName(name, 28)).toBe(name);
      const longer = "a".repeat(25) + ".jpg"; // 29
      expect(truncateFileName(longer, 28)).not.toBe(longer);
    });
  });

  describe("shortFileName (header badge, 22 chars)", () => {
    it("delegates to truncate with 22", () => {
      const long = "a".repeat(30) + ".png";
      expect(shortFileName(long).length).toBeLessThanOrEqual(22);
      expect(shortFileName(long).endsWith(".png")).toBe(true);
    });
    it("short name unchanged", () => {
      expect(shortFileName("hi.jpg")).toBe("hi.jpg");
    });
  });

  describe("detailFileName (Info row, 32 chars)", () => {
    it("allows longer than short", () => {
      const long = "a".repeat(40) + ".jpg";
      expect(detailFileName(long).length).toBeLessThanOrEqual(32);
      expect(detailFileName(long).length).toBeGreaterThan(shortFileName(long).length);
    });
  });
});
