import {
  Crop,
  Maximize,
  FileDown,
  ArrowRightLeft,
  RotateCw,
  ArrowDownLeft,
  Sun,
  Sparkles,
  Video,
  Info,
  LayoutGrid,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutGrid },
  { href: "/crop", label: "Crop", icon: Crop },
  { href: "/resize", label: "Resize", icon: Maximize },
  { href: "/compress", label: "Compress", icon: FileDown },
  { href: "/convert", label: "Convert", icon: ArrowRightLeft },
  { href: "/rotate", label: "Rotate", icon: RotateCw },
  { href: "/flip", label: "Flip", icon: ArrowDownLeft },
  { href: "/adjust", label: "Adjust", icon: Sun },
  { href: "/effects", label: "Effects", icon: Sparkles },
  { href: "/extract-thumbnail", label: "Thumbnail", icon: Video },
  { href: "/info", label: "Info", icon: Info },
];

// Organized groups for desktop header — visual separation without changing flat NAV_ITEMS (used by mobile & tests)
export const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  { label: "Edit", items: NAV_ITEMS.filter((i) => ["/crop", "/resize", "/rotate", "/flip"].includes(i.href)) },
  { label: "Optimize", items: NAV_ITEMS.filter((i) => ["/compress", "/convert"].includes(i.href)) },
  { label: "Style", items: NAV_ITEMS.filter((i) => ["/adjust", "/effects"].includes(i.href)) },
  { label: "Tools", items: NAV_ITEMS.filter((i) => ["/extract-thumbnail", "/info"].includes(i.href)) },
];
