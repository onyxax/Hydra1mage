// Centralized formatting helpers — avoids duplicating file-name logic across pages.

/**
 * Truncate a file name in the middle while preserving the extension.
 * Example: "very_long_file_name_2024_vacation_photo_final_edit.jpg" (52 chars)
 *   with max=28 => "very_long...nal_edit.jpg"
 * If name <= max, returns as-is.
 * If no extension, does plain end-truncate.
 */
export function truncateFileName(name: string, max = 28): string {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  // No extension or dot too early => simple truncate
  if (dot === -1 || dot < 3 || name.length - dot > 10) {
    // extension unusually long or no extension
    return name.slice(0, max - 1) + "…";
  }
  const ext = name.slice(dot); // includes dot
  const base = name.slice(0, dot);
  const keep = max - ext.length - 1; // 1 for …
  if (keep <= 6) return base.slice(0, max - ext.length - 1) + "…" + ext;
  const front = Math.ceil(keep * 0.65);
  const back = keep - front;
  return base.slice(0, front) + "…" + base.slice(base.length - back) + ext;
}

/**
 * Short display for header badges (more aggressive).
 * Keeps ~18 chars, good for 120px badges.
 */
export function shortFileName(name: string): string {
  return truncateFileName(name, 22);
}

/**
 * For detail rows where we have more space (55% row), allow 32 chars.
 */
export function detailFileName(name: string): string {
  return truncateFileName(name, 32);
}
